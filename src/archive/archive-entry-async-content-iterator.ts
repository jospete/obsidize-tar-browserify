import { ArchiveEntryLike } from '../common/archive-context.ts';

/**
 * Light wrapper around the `ArchiveEntry` class.
 * 
 * This streamlines reading file content chunks in an async iterator format,
 * so this data can be consumed in the same fashion as the other
 * pieces that this tar module provides.
 */
export class ArchiveEntryAsyncContentIterator implements AsyncIterableIterator<Uint8Array> {
	constructor(private readonly entry: ArchiveEntryLike) {
	}

	[Symbol.asyncIterator](): AsyncIterableIterator<Uint8Array> {
		return this;
	}

	public async next(): Promise<IteratorResult<Uint8Array>> {
		const data = await this.entry.readNextContentChunk();

		if (data !== null) {
			return { done: false, value: data };
		}

		return { done: true, value: null };
	}
}