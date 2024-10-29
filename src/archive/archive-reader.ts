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
		let buffer = await this.bufferIterator.tryNext();
		let ustarOffset = TarHeaderUtility.findNextUstarSectorOffset(buffer);

		while (ustarOffset < 0 && buffer) {
			buffer = await this.bufferIterator.tryNext();
			ustarOffset = TarHeaderUtility.findNextUstarSectorOffset(buffer);
		}

		if (ustarOffset < 0) {
			return {done: true, value: null};
		}

		while (ustarOffset + Constants.HEADER_SIZE > buffer!.byteLength) {
			const nextChunk = await this.bufferIterator.tryNext();
			if (nextChunk) {
				buffer = TarUtility.concatUint8Arrays(buffer!, nextChunk);
			} else {
				return {done: true, value: null};
			}
		}

		const offset = ustarOffset;
		const headerBuffer = buffer!.slice(ustarOffset, ustarOffset + Constants.HEADER_SIZE);
		const header = new TarHeader(headerBuffer);
		let nextOffset = TarUtility.advanceSectorOffset(ustarOffset, buffer!.byteLength);

		if (header.isGlobalPaxHeader) {
			this.mGlobalPaxHeaders.push(PaxTarHeader.from(buffer!, nextOffset));
			nextOffset = TarUtility.advanceSectorOffset(ustarOffset, buffer!.byteLength);

		} else if (header.isLocalPaxHeader) {
			header.setPax(PaxTarHeader.from(buffer!, nextOffset));
			nextOffset = TarUtility.advanceSectorOffset(ustarOffset, buffer!.byteLength);
		}

		const context = this;
		let content: Uint8Array | null = null;

		// If the buffer source is in-memory already, just read the content immediately
		if (this.bufferIterator.input instanceof InMemoryAsyncUint8Array) {
			const contentEnd = nextOffset + header.fileSize;
			while (buffer!.byteLength < contentEnd) {
				const nextChunk = await this.bufferIterator.tryNext();
				if (nextChunk) {
					buffer = TarUtility.concatUint8Arrays(buffer!, nextChunk);
				} else {
					return {done: true, value: null};
				}
			}
		}

		const entry = new TarEntry({header, offset, content, context});
		
		return {done: false, value: entry};
	}
}