import { TarUtility } from '../common';
import { TarEntry } from './tar-entry';
import { TarEntryIteratorBase } from './tar-entry-iterator-base';

/**
 * Utility for stepping through a given byte buffer and extracting tar files one-at-a-time.
 * 
 * Call the initialize() the Uint8Array data of a tar file, and then either:
 * A) step through the files using next() manually, or
 * B) get all the files at once with Array.from()
 */
export class TarEntryIterator extends TarEntryIteratorBase implements IterableIterator<TarEntry> {

	private mData: Uint8Array | null;

	constructor() {
		super();
		this.initialize(null);
	}

	[Symbol.iterator](): IterableIterator<TarEntry> {
		return this;
	}

	public initialize(data: Uint8Array | null): void {

		if (TarUtility.isUint8Array(data)) {
			this.mData = data!;
			this.bufferLength = this.mData.byteLength;

		} else {
			this.mData = null;
			this.bufferLength = 0;
		}

		this.bufferOffset = 0;
	}

	public next(): IteratorResult<TarEntry> {

		if (!this.canAdvanceOffset()) {
			return { value: null, done: true };
		}

		const entry = TarEntry.tryParse(this.mData!, this.bufferOffset);
		return this.consumeIteratorResult(entry);
	}
}