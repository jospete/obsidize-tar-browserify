import { TarFile } from './tar-file';

/**
 * Utility for stepping through a given byte buffer and extracting tar files one-at-a-time.
 */
export class TarIterator implements IterableIterator<TarFile> {

	private mData: Uint8Array | null = null;
	private mOffset: number = 0;
	private mMaxOffset: number = 0;

	constructor(data: Uint8Array | null = null) {
		this.initialize(data);
	}

	[Symbol.iterator](): IterableIterator<TarFile> {
		return this;
	}

	public get offset(): number {
		return this.mOffset;
	}

	public get bufferLength(): number {
		return this.mMaxOffset;
	}

	public canAdvanceOffset(): boolean {
		return !!this.mData && this.offset < this.bufferLength;
	}

	public initialize(data: Uint8Array | null): void {
		this.mData = data ? Uint8Array.from(data) : null;
		this.mOffset = 0;
		this.mMaxOffset = this.mData ? this.mData.byteLength : 0;
	}

	public next(): IteratorResult<TarFile> {

		if (!this.canAdvanceOffset()) {
			return { value: null, done: true };
		}

		const { file, nextOffset } = TarFile.extractNextFile(this.mData!, this.offset, this.bufferLength);
		this.mOffset = Math.min(this.bufferLength, Math.max(this.offset, nextOffset));

		const value = file!;
		const done = !this.canAdvanceOffset();

		return { value, done };
	}
}