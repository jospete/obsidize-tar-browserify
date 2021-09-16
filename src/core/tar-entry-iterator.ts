import { extractTarEntry } from './extract-tar-entry';
import { TarUtility } from './tar-utility';
import { TarEntry } from './tar-entry';

const { clamp } = TarUtility;

/**
 * Utility for stepping through a given byte buffer and extracting tar files one-at-a-time.
 */
export class TarEntryIterator implements IterableIterator<TarEntry> {

	private mData: Uint8Array | null = null;
	private mOffset: number = 0;
	private mMaxOffset: number = 0;

	constructor(data: Uint8Array | null = null) {
		this.initialize(data);
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

	public initialize(data: Uint8Array | null): void {
		this.mData = data ? Uint8Array.from(data) : null;
		this.mOffset = 0;
		this.mMaxOffset = this.mData ? this.mData.byteLength : 0;
	}

	public next(): IteratorResult<TarEntry> {

		if (!this.canAdvanceOffset()) {
			return { value: null, done: true };
		}

		const { entry, nextOffset } = extractTarEntry(this.mData!, this.bufferOffset);
		this.mOffset = clamp(nextOffset, this.bufferOffset, this.bufferLength);

		const value = entry!;
		const done = !this.canAdvanceOffset();

		return { value, done };
	}
}