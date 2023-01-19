import { TarUtility } from '../common';
import { TarEntry } from './tar-entry';

/**
 * Shared logic between async and sync iterators.
 */
export abstract class TarEntryIteratorBase {

	private mOffset: number = 0;
	private mSize: number = 0;

	protected get defaultIteratorResult(): IteratorResult<TarEntry> {
		return { value: null, done: true };
	}

	public get bufferOffset(): number {
		return this.mOffset;
	}

	public set bufferOffset(value: number) {
		this.mOffset = TarUtility.clamp(value, 0, this.bufferLength);
	}

	public get bufferLength(): number {
		return this.mSize;
	}

	public set bufferLength(value: number) {
		this.mSize = Math.max(0, value);
	}

	public canAdvanceOffset(): boolean {
		return this.bufferOffset < this.bufferLength;
	}

	public toJSON(): any {
		const { bufferOffset, bufferLength } = this;
		const canAdvanceOffset = this.canAdvanceOffset();
		return { bufferOffset, bufferLength, canAdvanceOffset };
	}

	protected consumeIteratorResult(entry: TarEntry | null): IteratorResult<TarEntry> {

		if (!entry) {
			return this.defaultIteratorResult;
		}

		this.bufferOffset = entry.bufferEndIndex;

		const value = entry;
		const done = !this.canAdvanceOffset();

		return { value, done };
	}
}