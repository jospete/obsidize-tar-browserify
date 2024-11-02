import { AsyncUint8ArrayLike } from './async-uint8-array';
import { Constants } from './constants';
import { TarUtility } from './tar-utility';

/**
 * Read result when `AsyncUint8ArrayIterator.next()` succeeds.
 */
export interface AsyncUint8ArrayBlock {
	/**
	 * The input object that the data 
	 */
	source: AsyncUint8ArrayLike;
	/**
	 * The value read from the source
	 */
	buffer: Uint8Array;
	/**
	 * The absolute offset in the source that the value was read from
	 */
	offset: number;
}

/**
 * Generalized symbol / type for AsyncUint8ArrayIterator
 */
export type AsyncUint8ArrayIteratorLike = AsyncIterableIterator<AsyncUint8ArrayBlock>;

export interface AsyncUint8ArrayIteratorOptions {
	/**
	 * Custom block size to read chunks in.
	 * Must be a multiple of `SECTOR_SIZE`.
	 * Cannot be smaller than `SECTOR_SIZE`.
	 */
	blockSize: number;
}

function sanitizeOptions(options: Partial<AsyncUint8ArrayIteratorOptions>): AsyncUint8ArrayIteratorOptions {
	return Object.assign({
		blockSize: Constants.SECTOR_SIZE * 16 // 8Kb
	}, options);
}

const MIN_BLOCK_SIZE = Constants.SECTOR_SIZE;
const MAX_BLOCK_SIZE = Constants.SECTOR_SIZE * 10000;

/**
 * Generalized abstraction for pulling in raw octet data, whether its
 * over the network or from disk or in memory.
 * 
 * This is designed to reduce general complexity / fragmentation
 * when parsing out tar sectors by forcing every input type to adhere to
 * the same streaming interface.
 */
export class AsyncUint8ArrayIterator implements AsyncUint8ArrayIteratorLike {
	private readonly blockSize: number;
	private mByteLength: number | undefined;
	private mOffset: number = 0;

	constructor(
		private readonly mInput: AsyncUint8ArrayLike,
		options: AsyncUint8ArrayIteratorOptions | Partial<AsyncUint8ArrayIteratorOptions> = {}
	) {
		let {blockSize} = sanitizeOptions(options);
		blockSize = TarUtility.clamp(blockSize, MIN_BLOCK_SIZE, MAX_BLOCK_SIZE);
		blockSize = TarUtility.roundUpSectorOffset(blockSize);
 		this.blockSize = blockSize;
	}

	[Symbol.asyncIterator](): AsyncUint8ArrayIteratorLike {
		return this;
	}

	public get input(): AsyncUint8ArrayLike {
		return this.mInput;
	}

	public get byteLength(): number | undefined {
		return this.mByteLength;
	}

	public get currentOffset(): number {
		return this.mOffset;
	}

	/**
	 * Must be called before next(), otherwise the iteration
	 * will terminate immediately.
	 */
	public async initialize(): Promise<void> {
		this.mByteLength = await this.input.byteLength();
		this.mOffset = 0;
	}

	public async tryNext(): Promise<Uint8Array | null> {
		const result = await this.next();
		return result?.value?.buffer ? result.value.buffer : null;
	}

	/**
	 * Grab the next {blockSize} chunk of data from the input.
	 * See `AsyncIterableIterator` for more info.
	 */
	public async next(): Promise<IteratorResult<AsyncUint8ArrayBlock>> {
		const source = this.input;
		const offset = this.mOffset;
		const canAdvanceOffset = TarUtility.isNumber(this.mByteLength) && this.mOffset < this.mByteLength;
		
		if (canAdvanceOffset) {
			const targetLength = Math.min(this.blockSize, this.mByteLength! - offset);
			const buffer = await source.read(this.mOffset, targetLength);
			this.mOffset += targetLength;
			return {done: false, value: {source, buffer, offset}};
		}

		return {done: true, value: null};
	}
}
