import { SECTOR_SIZE } from './constants';
import { clamp } from './transforms';

/**
 * Generalized iterface for interacting with buffers that we only have a partial view into.
 */
export interface AsyncUint8Array {
	byteLength(): Promise<number>;
	read(offset: number, length: number): Promise<Uint8Array>;
}

/**
 * Result shape returned by findInAsyncUint8Array()
 */
export interface AsyncUint8ArraySearchResult {
	source: AsyncUint8Array;
	value: Uint8Array;
	offset: number;
}

/**
 * Searches the given AsyncUint8Array for a block that meets the given predicate.
 * @param offset the absolute offset to start reads from
 * @param stepSize the _relative_ step size in multiples of SECTOR_SIZE (i.e. stepSize = 3 --> blockSize = SECTOR_SIZE * 3)
 */
export async function findInAsyncUint8Array(
	target: AsyncUint8Array,
	offset: number,
	stepSize: number,
	predicate: (value: Uint8Array, offset: number, target: AsyncUint8Array) => boolean
): Promise<AsyncUint8ArraySearchResult | null> {

	if (!target || !predicate) {
		return null;
	}

	const maxLength = await target.byteLength();
	offset = clamp(offset, 0, maxLength);

	if (offset >= maxLength) {
		return null;
	}

	// don't allow reading more than ~250KB at a time by default
	const blockSize = clamp(stepSize, 1, SECTOR_SIZE) * SECTOR_SIZE;

	let found = false;
	let cursor = offset;
	let result: Uint8Array;

	while (!found && cursor < maxLength) {
		result = await target.read(cursor, blockSize);
		found = predicate(result, cursor, target);
		cursor += blockSize;
	}

	if (found) {
		return { source: target, value: result!, offset: cursor };
	}

	return null;
}