import { ArchiveContext } from '../common/archive-context';
import { AsyncUint8ArrayLike, InMemoryAsyncUint8Array } from '../common/async-uint8-array';
import { AsyncUint8ArrayIterator } from '../common/async-uint8-array-iterator';
import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarEntry } from '../entry/tar-entry';
import { TarHeader } from '../header/tar-header';
import { TarHeaderUtility } from '../header/tar-header-utility';
import { PaxTarHeader } from '../pax/pax-tar-header';

/**
 * Generic utility for parsing tar entries from a stream of octets via `AsyncUint8ArrayIterator`
 */
export class ArchiveReader implements ArchiveContext, AsyncIterableIterator<TarEntry> {
	private mGlobalPaxHeaders: PaxTarHeader[] = [];
	private mBufferCache: Uint8Array | null = null;
	private mOffset: number = 0;

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

	public async next(): Promise<IteratorResult<TarEntry>> {
		const defaultReturnValue: IteratorReturnResult<null> = {done: true, value: null};
		let buffer = this.mBufferCache;

		// Initialize the buffer if we don't have anything loaded
		if (!buffer) {
			if (!(await this.loadNextChunk())) {
				return defaultReturnValue;
			}

			buffer = this.mBufferCache;
		}

		let ustarOffset = TarHeaderUtility.findNextUstarSectorOffset(buffer, this.mOffset);

		// Find next ustar marker
		while (ustarOffset < 0 && (await this.loadNextChunk())) {
			ustarOffset = TarHeaderUtility.findNextUstarSectorOffset(buffer, this.mOffset);
		}

		if (ustarOffset < 0) {
			return defaultReturnValue;
		}

		// load chunks until we have a full header block
		while ((ustarOffset + Constants.HEADER_SIZE) > buffer!.byteLength) {
			if (!(await this.loadNextChunk())) {
				return defaultReturnValue;
			}
		}

		// Construct Header
		const headerBuffer = buffer!.slice(ustarOffset, ustarOffset + Constants.HEADER_SIZE);
		const header = new TarHeader(headerBuffer);

		// Advance cursor to process potential PAX header or entry content
		const offset = ustarOffset;
		let nextOffset = TarUtility.advanceSectorOffset(ustarOffset, buffer!.byteLength);

		// Capture global header and advance to next sector
		if (header.isGlobalPaxHeader) {
			this.mGlobalPaxHeaders.push(PaxTarHeader.from(buffer!, nextOffset));
			nextOffset = TarUtility.advanceSectorOffset(ustarOffset, buffer!.byteLength);

		// Capture local header and advance to next sector
		} else if (header.isLocalPaxHeader) {
			header.setPax(PaxTarHeader.from(buffer!, nextOffset));
			nextOffset = TarUtility.advanceSectorOffset(ustarOffset, buffer!.byteLength);
		}

		const context = this;
		const contentEnd = nextOffset + header.fileSize;
		let content: Uint8Array | null = null;

		// If the buffer source is in-memory already, just read the content immediately
		if (this.bufferIterator.input instanceof InMemoryAsyncUint8Array) {
			while (buffer!.byteLength < contentEnd) {
				if (!(await this.loadNextChunk())) {
					return defaultReturnValue;
				}
			}

			content = buffer!.slice(nextOffset, contentEnd);
		}

		if ((contentEnd + Constants.SECTOR_SIZE) <= buffer!.byteLength) {
			this.mBufferCache = buffer;
			this.mOffset = contentEnd;

		} else {
			this.mBufferCache = null;
			this.mOffset = 0;
		}

		const entry = new TarEntry({header, offset, content, context});
		
		return {done: false, value: entry};
	}
}