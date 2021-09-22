import { TarEntryUtility, TarEntry } from '../entry';
import { TarUtility } from '../tar-utility';

/**
 * Utility for stepping through a given byte buffer and extracting tar files one-at-a-time.
 * 
 * Call the initialize() the Uint8Array data of a tar file, and then either:
 * A) step through the files using next() manually, or
 * B) get all the files at once with Array.from()
 */
export class TarEntryIterator implements IterableIterator<TarEntry> {

	private mData: Uint8Array | null;
	private mOffset: number;
	private mMaxOffset: number;

	constructor() {
		this.initialize(null);
	}

	[Symbol.iterator](): IterableIterator<TarEntry> {
		return this;
	}

	public get bufferOffset(): number {
		return this.mOffset;
	}

	public get bufferLength(): number {
		return this.mMaxOffset;
	}

	public canAdvanceOffset(): boolean {
		return !!this.mData && this.bufferOffset < this.bufferLength;
	}

	public toJSON(): any {
		const { bufferOffset, bufferLength } = this;
		const canAdvanceOffset = this.canAdvanceOffset();
		return { bufferOffset, bufferLength, canAdvanceOffset };
	}

	public initialize(data: Uint8Array | null): this {

		if (TarUtility.isUint8Array(data)) {
			this.mData = data!.slice();
			this.mMaxOffset = this.mData.byteLength;

		} else {
			this.mData = null;
			this.mMaxOffset = 0;
		}

		this.mOffset = 0;

		return this;
	}

	public next(): IteratorResult<TarEntry> {

		if (!this.canAdvanceOffset()) {
			return { value: null, done: true };
		}

		const metadata = TarEntryUtility.extractEntryMetadata(this.mData!, this.bufferOffset);

		if (!metadata) {
			return { value: null, done: true };
		}

		const { header, content, byteLength } = metadata;
		this.mOffset = TarUtility.clamp(byteLength + this.bufferOffset, this.bufferOffset, this.bufferLength);

		const value = new TarEntry(header, content);
		const done = !this.canAdvanceOffset();

		return { value, done };
	}
}