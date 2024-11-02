import { ArchiveContext } from '../common/archive-context';
import { AsyncUint8ArrayLike, InMemoryAsyncUint8Array } from '../common/async-uint8-array';
import { AsyncUint8ArrayIterator } from '../common/async-uint8-array-iterator';
import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarEntry } from '../entry/tar-entry';
import { TarHeader } from '../header/tar-header';
import { TarHeaderUtility } from '../header/tar-header-utility';
import { PaxTarHeader } from '../pax/pax-tar-header';

const MAX_LOADED_BYTES = Constants.SECTOR_SIZE * 100000; // ~50Mb

interface TarHeaderParseResult {
	header: TarHeader;
	headerOffset: number;
	contentOffset: number;
}

/**
 * Generic utility for parsing tar entries from a stream of octets via `AsyncUint8ArrayIterator`
 */
export class ArchiveReader implements ArchiveContext, AsyncIterableIterator<TarEntry> {
	private mGlobalPaxHeaders: PaxTarHeader[] = [];
	private mBufferCache: Uint8Array | null = null;
	private mOffset: number = 0;
	private mHasSyncInput: boolean = false;

	constructor(
		private readonly bufferIterator: AsyncUint8ArrayIterator
	) {
	}
	
	[Symbol.asyncIterator](): AsyncIterableIterator<TarEntry> {
		return this;
	}

	public get source(): AsyncUint8ArrayLike {
		return this.bufferIterator.input;
	}

	public get globalPaxHeaders(): PaxTarHeader[] {
		return this.mGlobalPaxHeaders;
	}

	public async initialize(): Promise<void> {
		this.mBufferCache = null;
		this.mOffset = 0;
		this.mHasSyncInput = this.bufferIterator.input instanceof InMemoryAsyncUint8Array;
		await this.bufferIterator.initialize();
	}

	public async readAllEntries(): Promise<TarEntry[]> {
		const entries: TarEntry[] = [];
		await this.initialize();

		for await (const entry of this) {
			entries.push(entry);
		}
		
		return entries;
	}

	public async next(): Promise<IteratorResult<TarEntry>> {
		const entry = await this.tryParseNextEntry();

		if (entry !== null) {
			return {done: false, value: entry};
		}
		
		return {done: true, value: null};
	}

	private clearBufferCache(): void {
		this.mBufferCache = null;
		this.mOffset = 0;
	}

	private async loadNextChunk(): Promise<boolean> {
		const nextChunk = await this.bufferIterator.tryNext();
		
		if (!nextChunk) {
			return false;
		}

		if (this.mBufferCache) {
			this.mBufferCache = TarUtility.concatUint8Arrays(this.mBufferCache!, nextChunk!);
		} else {
			this.mBufferCache = nextChunk!;
			this.mOffset = 0;
		}

		return true;
	}

	private async tryParseNextEntry(): Promise<TarEntry | null> {
		const headerParseResult = await this.tryParseNextHeader();

		if (headerParseResult === null) {
			this.clearBufferCache();
			return null;
		}

		const context = this;
		const {header, headerOffset, contentOffset} = headerParseResult;
		const contentEnd = contentOffset + header.fileSize;
		const offset = headerOffset;

		let content: Uint8Array | null = null;
		let buffer = this.mBufferCache;

		// If the buffer source is in-memory already, just read the content immediately
		if (this.mHasSyncInput) {
			while (buffer!.byteLength < contentEnd) {
				if (!(await this.loadNextChunk())) {
					this.clearBufferCache();
					return null;
				}
			}

			content = buffer!.slice(contentOffset, contentEnd);
		}

		// `contentEnd` may not be an even division of SECTOR_SIZE, so
		// round up to the nearest sector start point after the content end.
		const nextSectorStart = TarUtility.roundUpSectorOffset(contentEnd);

		if ((nextSectorStart + Constants.SECTOR_SIZE) <= buffer!.byteLength) {
			this.mBufferCache = buffer!.slice(nextSectorStart);
			this.mOffset = 0;

		} else {
			this.clearBufferCache();
		}

		return new TarEntry({header, offset, content, context});
	}

	private async tryParseNextHeader(): Promise<TarHeaderParseResult | null> {
		let buffer = this.mBufferCache;

		// Initialize the buffer if we don't have anything loaded
		if (!buffer) {
			if (!(await this.loadNextChunk())) {
				this.clearBufferCache();
				return null;
			}

			buffer = this.mBufferCache;
		}

		let ustarOffset = TarHeaderUtility.findNextUstarSectorOffset(buffer, this.mOffset);

		// Find next ustar marker
		while (ustarOffset < 0 && buffer!.byteLength < MAX_LOADED_BYTES && (await this.loadNextChunk())) {
			ustarOffset = TarHeaderUtility.findNextUstarSectorOffset(buffer, ustarOffset);
		}

		if (ustarOffset < 0) {
			this.clearBufferCache();
			return null;
		}

		// load chunks until we have a full header block
		while ((ustarOffset + Constants.HEADER_SIZE) > buffer!.byteLength) {
			if (!(await this.loadNextChunk())) {
				this.clearBufferCache();
				return null;
			}
		}

		// Construct Header
		const headerOffset = ustarOffset;
		const headerBuffer = buffer!.slice(ustarOffset, ustarOffset + Constants.HEADER_SIZE);
		const header = new TarHeader(headerBuffer);

		// Advance cursor to process potential PAX header or entry content
		let nextOffset = TarUtility.advanceSectorOffset(ustarOffset, buffer!.byteLength);

		// load chunks until we have a full PAX header block
		while ((nextOffset + Constants.HEADER_SIZE) > buffer!.byteLength) {
			if (!(await this.loadNextChunk())) {
				this.clearBufferCache();
				return null;
			}
		}

		// Capture global header and advance to next sector
		if (header.isGlobalPaxHeader) {
			this.mGlobalPaxHeaders.push(PaxTarHeader.from(buffer!, nextOffset));
			nextOffset = TarUtility.advanceSectorOffset(ustarOffset, buffer!.byteLength);

		// Capture local header and advance to next sector
		} else if (header.isLocalPaxHeader) {
			header.pax = PaxTarHeader.from(buffer!, nextOffset);
			nextOffset = TarUtility.advanceSectorOffset(ustarOffset, buffer!.byteLength);
		}

		return {header, headerOffset, contentOffset: nextOffset};
	}
}
