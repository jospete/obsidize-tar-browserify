import { AsyncUint8Array } from '../common/async-uint8array';
import { TarEntry } from './tar-entry';
import { TarEntryIteratorBase } from './tar-entry-iterator-base';

export type TarEntryDelegate = (entry: TarEntry, index: number, buffer: AsyncUint8Array) => Promise<void>;

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
	 * Convenience to step through entries one-at-a-time, without collecting them.
	 * Helps to emulate "streaming" functionality that other tar modules have.
	 */
	public static async forEachIn(buffer: AsyncUint8Array, onNext: TarEntryDelegate): Promise<void> {

		const iterator = new AsyncTarEntryIterator();

		await iterator.initialize(buffer);
		let i = 0;

		for await (const entry of iterator) {
			await onNext(entry, i, buffer);
			i++;
		}
	}

	/**
	 * Convenience to parse out all entries in one go.
	 */
	public static async extractAll(buffer: AsyncUint8Array): Promise<TarEntry[]> {

		const result: TarEntry[] = [];

		await AsyncTarEntryIterator.forEachIn(buffer, async entry => {
			result.push(entry);
		});

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