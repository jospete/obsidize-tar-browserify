/**
 * Generalized iterface for interacting with buffers that we only have a partial view into.
 */
export interface AsyncUint8ArrayLike {
	byteLength(): Promise<number>;
	read(offset: number, length: number): Promise<Uint8Array>;
}

/**
 * Built-in wrapper for basic in-memory buffers so they
 * can be transposed to fit the shared `AsyncUint8ArrayLike` format.
 */
export class InMemoryAsyncUint8Array implements AsyncUint8ArrayLike {
	constructor(
		private readonly input: Uint8Array
	) {
	}
	
	public byteLength(): Promise<number> {
		return Promise.resolve(this.input.byteLength);
	}

	public read(offset: number, length: number): Promise<Uint8Array> {
		const max = this.input.byteLength;
		const start = Math.min(offset, max);
		const end = Math.min(start + length, max);
		return Promise.resolve(this.input.slice(start, end));
	}
}
