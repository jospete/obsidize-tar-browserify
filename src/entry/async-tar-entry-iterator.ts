import { AsyncUint8Array, noop } from '../common';
import { TarEntry } from './tar-entry';
import { TarEntryIteratorBase } from './tar-entry-iterator-base';

export type TarEntryDelegate = (entry: TarEntry) => any;

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

	/**
	 * Convenience to parse out all entries in one go.
	 */
	public static async extractAll(
		buffer: AsyncUint8Array,
		onNextEntry?: TarEntryDelegate
	): Promise<TarEntry[]> {

		if (!onNextEntry) onNextEntry = noop;

		const iterator = new AsyncTarEntryIterator();
		const result: TarEntry[] = [];

		await iterator.initialize(buffer);

		for await (const entry of iterator) {
			onNextEntry(entry);
			result.push(entry);
		}

		return result;
	}

	[Symbol.asyncIterator](): AsyncIterableIterator<TarEntry> {
		return this;
	}

	public async next(): Promise<IteratorResult<TarEntry>> {
		return this.canAdvanceOffset()
			? this.consumeIteratorResult(await TarEntry.tryParseAsync(this.mData!, this.bufferOffset))
			: this.defaultIteratorResult;
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
}