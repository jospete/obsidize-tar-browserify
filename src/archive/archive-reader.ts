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
 * Errors that will be thrown if the reader encounters an invalid data layout
 */
export enum ArchiveReadError {
	/**
	 * Occurs when the reader fails to fully load the content buffer of an entry
	 * due to the input data stream ending prematurely.
	 */
	ERR_ENTRY_CONTENT_MIN_BUFFER_LENGTH_NOT_MET = 'ERR_ENTRY_CONTENT_MIN_BUFFER_LENGTH_NOT_MET',
	/**
	 * Occurs when the reader fails to fully load a PAX header
	 * due to the input data stream ending prematurely.
	 */
	ERR_HEADER_PAX_MIN_BUFFER_LENGTH_NOT_MET = 'ERR_HEADER_PAX_MIN_BUFFER_LENGTH_NOT_MET',
	/**
	 * Occurs when the reader fails to fully load a PAX header
	 * due to the third and final segment not appearing in the input data stream.
	 */
	ERR_HEADER_MISSING_POST_PAX_SEGMENT = 'ERR_HEADER_MISSING_POST_PAX_SEGMENT'
}

/**
 * Generic utility for parsing tar entries from a stream of octets via `AsyncUint8ArrayIterator`
 */
export class ArchiveReader implements ArchiveContext, AsyncIterableIterator<TarEntry> {
	private mGlobalPaxHeaders: TarHeader[] = [];
	private mBufferCache: Uint8Array | null = null;
	private mOffset: number = 0;
	private mHasSyncInput: boolean = false;

	constructor(
		private readonly bufferIterator: AsyncUint8ArrayIterator
	) {
	}

	public static readAllEntriesFromMemory(buffer: Uint8Array): Promise<TarEntry[]> {
		return ArchiveReader.readAllEntriesFromStream(new InMemoryAsyncUint8Array(buffer));
	}

	public static readAllEntriesFromStream(stream: AsyncUint8ArrayLike): Promise<TarEntry[]> {
		const iterator = new AsyncUint8ArrayIterator(stream);
		const reader = new ArchiveReader(iterator);
		return reader.readAllEntries();
	}
	
	[Symbol.asyncIterator](): AsyncIterableIterator<TarEntry> {
		return this;
	}

	public get source(): AsyncUint8ArrayLike {
		return this.bufferIterator.input;
	}

	public get globalPaxHeaders(): TarHeader[] {
		return this.mGlobalPaxHeaders;
	}

	public async initialize(): Promise<void> {
		this.mBufferCache = null;
		this.mOffset = 0;
		this.mHasSyncInput = (this.bufferIterator.input instanceof InMemoryAsyncUint8Array);
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

	private getBufferCacheSlice(start: number, end?: number): Uint8Array {
		return TarUtility.cloneUint8Array(this.mBufferCache!, start, end);
	}

	private async tryRequireBufferSize(size: number): Promise<boolean> {
		const buffer = await this.requireBufferSize(size);
		return buffer !== null;
	}

	private async requireBufferSize(size: number): Promise<Uint8Array | null> {
		while (!this.mBufferCache || this.mBufferCache!.byteLength < size) {
			if (!(await this.loadNextChunk())) {
				this.clearBufferCache();
				return null;
			}
		}

		return this.mBufferCache;
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

		// `contentEnd` may not be an even division of SECTOR_SIZE, so
		// round up to the nearest sector start point after the content end.
		const nextSectorStart = TarUtility.roundUpSectorOffset(contentEnd);

		let content: Uint8Array | null = null;

		// If the buffer source is in-memory already, just read the content immediately
		if (this.mHasSyncInput && header.fileSize > 0) {
			if (!(await this.tryRequireBufferSize(nextSectorStart))) {
				throw ArchiveReadError.ERR_ENTRY_CONTENT_MIN_BUFFER_LENGTH_NOT_MET;
			}

			content = this.getBufferCacheSlice(contentOffset, contentEnd);
		}

		if ((nextSectorStart + Constants.SECTOR_SIZE) <= this.mBufferCache!.byteLength) {
			this.mBufferCache = this.getBufferCacheSlice(nextSectorStart);
			this.mOffset = 0;

		} else {
			this.mOffset = nextSectorStart;
		}

		return new TarEntry({header, offset, content, context});
	}

	private async tryParseNextHeader(): Promise<TarHeaderParseResult | null> {
		if (!(await this.tryRequireBufferSize(this.mOffset + Constants.HEADER_SIZE))) {
			return null;
		}

		let ustarOffset = TarHeaderUtility.findNextUstarSectorOffset(this.mBufferCache, this.mOffset);

		// Find next ustar marker
		while (ustarOffset < 0 && this.mBufferCache!.byteLength < MAX_LOADED_BYTES && (await this.loadNextChunk())) {
			ustarOffset = TarHeaderUtility.findNextUstarSectorOffset(this.mBufferCache, this.mOffset);
		}

		// No header marker found and we ran out of bytes to load, terminate
		if (ustarOffset < 0) {
			this.clearBufferCache();
			return null;
		}

		// Construct Header
		let headerOffset = ustarOffset;
		let headerBuffer = this.getBufferCacheSlice(headerOffset, headerOffset + Constants.HEADER_SIZE);
		let header = new TarHeader(headerBuffer);

		// Advance cursor to process potential PAX header or entry content
		let nextOffset = TarUtility.advanceSectorOffset(headerOffset, this.mBufferCache!.byteLength);

		if (header.isPaxHeader) {
			// Make sure we've buffered the pax header region and the next sector after that (next sector contains the _actual_ header)
			const paxHeaderSectorEnd = nextOffset + TarUtility.roundUpSectorOffset(header.ustarFileSize);
			const requiredBufferSize = paxHeaderSectorEnd + Constants.HEADER_SIZE;
			const isGlobalPax = header.isGlobalPaxHeader;

			if (!(await this.tryRequireBufferSize(requiredBufferSize))) {
				throw ArchiveReadError.ERR_HEADER_PAX_MIN_BUFFER_LENGTH_NOT_MET;
			}

			// Parse the pax header out from the next sector
			const paxHeader = PaxTarHeader.from(this.mBufferCache!, nextOffset);
			nextOffset = paxHeaderSectorEnd;

			if (!TarHeaderUtility.isUstarSector(this.mBufferCache!, nextOffset)) {
				throw ArchiveReadError.ERR_HEADER_MISSING_POST_PAX_SEGMENT;
			}

			// The _actual_ header is AFTER the pax header, so need to do the header parse song and dance one more time
			headerOffset = nextOffset;
			headerBuffer = this.getBufferCacheSlice(headerOffset, headerOffset + Constants.HEADER_SIZE);
			header = new TarHeader(headerBuffer);
			header.pax = paxHeader;
			nextOffset = TarUtility.advanceSectorOffsetUnclamped(nextOffset);

			if (isGlobalPax) {
				this.mGlobalPaxHeaders.push(header);
			}
		}

		return {header, headerOffset, contentOffset: nextOffset};
	}
}
