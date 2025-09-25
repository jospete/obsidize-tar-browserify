import { AsyncUint8ArrayLike, InMemoryAsyncUint8Array } from './async-uint8-array.ts';
import { Constants } from './constants.ts';
import { TarUtility } from './tar-utility.ts';

/**
 * Read result when `AsyncUint8ArrayIterator.next()` succeeds.
 */
export interface AsyncUint8ArrayBlock {
	/**
	 * The input object that has provided the data from some external mechanism
	 */
	source: AsyncUint8ArrayLike;
	/**
	 * The value read from `source`
	 */
	buffer: Uint8Array;
	/**
	 * The absolute offset in `source` that `buffer` was read from.
	 * This will be in range [0, source.byteLength]
	 */
	offset: number;
}

/**
 * Generalized symbol / type for AsyncUint8ArrayIterator
 */
export type AsyncUint8ArrayIteratorLike = AsyncIterableIterator<AsyncUint8ArrayBlock>;

/**
 * Valid input types for an AsyncUint8ArrayIterator instance
 */
export type AsyncUint8ArrayIteratorInput = Uint8Array | AsyncUint8ArrayLike;

export interface AsyncUint8ArrayIteratorOptions {
	/**
	 * Custom block size to read chunks in.
	 * Must be a multiple of `SECTOR_SIZE`.
	 * Cannot be smaller than `SECTOR_SIZE`.
	 */
	blockSize: number;
}

const MIN_BLOCK_SIZE = Constants.SECTOR_SIZE;
const MAX_BLOCK_SIZE = Constants.SECTOR_SIZE * 10000 * 4; // ~20MB

function sanitizeOptions(options: Partial<AsyncUint8ArrayIteratorOptions>): AsyncUint8ArrayIteratorOptions {
	return Object.assign(
		{
			blockSize: MAX_BLOCK_SIZE / 2,
		},
		options,
	);
}

/**
 * Generalized abstraction for pulling in raw octet data, whether its
 * over the network or from disk or in memory.
 *
 * This is designed to reduce general complexity / fragmentation
 * when parsing out tar sectors by forcing every input type to adhere to
 * the same streaming interface.
 */
export class AsyncUint8ArrayIterator implements AsyncUint8ArrayIteratorLike {
	private readonly mInput: AsyncUint8ArrayLike;
	private readonly blockSize: number;
	private mOffset: number = 0;

	constructor(input: AsyncUint8ArrayIteratorInput, options: Partial<AsyncUint8ArrayIteratorOptions> = {}) {
		this.mInput = TarUtility.isUint8Array(input) ? new InMemoryAsyncUint8Array(input) : input;
		let { blockSize } = sanitizeOptions(options);
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

	public get byteLength(): number {
		return this.mInput.byteLength;
	}

	public get currentOffset(): number {
		return this.mOffset;
	}

	public async tryNext(): Promise<Uint8Array | null> {
		const result = await this.next();
		return result?.value?.buffer ?? null;
	}

	/**
	 * Grab the next `blockSize` chunk of data from the input.
	 * See `AsyncIterableIterator` for more info.
	 */
	public async next(): Promise<IteratorResult<AsyncUint8ArrayBlock>> {
		const source = this.input;
		const offset = this.currentOffset;
		const length = this.byteLength;

		if (offset >= length) {
			return { done: true, value: null };
		}

		const targetLength = Math.min(this.blockSize, length - offset);
		const buffer = await source.read(offset, targetLength);
		this.mOffset += targetLength;

		return { done: false, value: { source, buffer, offset } };
	}
}
