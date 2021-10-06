import { TarUtility } from '../common';

/**
 * Shared logic between async and sync iterators.
 */
export class TarEntryIteratorBase {

	private mOffset: number = 0;
	private mSize: number = 0;

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
}