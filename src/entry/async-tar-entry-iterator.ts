import { AsyncUint8Array } from '../common';
import { TarEntry } from './tar-entry';
import { TarEntryIteratorBase } from './tar-entry-iterator-base';

/**
 * Utility for stepping through a given byte buffer and extracting tar files one-at-a-time.
 * 
 * Call the initialize() the Uint8Array data of a tar file, and then either:
 * A) step through the files using next() manually, or
 * B) get all the files at once with Array.from()
 */
export class AsyncTarEntryIterator extends TarEntryIteratorBase implements AsyncIterableIterator<TarEntry> {

	private mData: AsyncUint8Array | null;

	constructor() {
		super();
		this.initialize(null);
	}

	[Symbol.asyncIterator](): AsyncIterableIterator<TarEntry> {
		return this;
	}

	public async initialize(data: AsyncUint8Array | null): Promise<void> {

		if (data) {
			this.mData = data;
			this.bufferLength = await this.mData.byteLength();

		} else {
			this.mData = null;
			this.bufferLength = 0;
		}

		this.bufferOffset = 0;
	}

	public async next(): Promise<IteratorResult<TarEntry>> {

		if (!this.canAdvanceOffset()) {
			return { value: null, done: true };
		}

		const entry = await TarEntry.tryParseAsync(this.mData!, this.bufferOffset);
		return this.consumeIteratorResult(entry);
	}
}