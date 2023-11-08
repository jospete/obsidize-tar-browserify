import { AsyncUint8Array, AsyncUint8ArraySearchResult, findInAsyncUint8Array } from '../common/async-uint8array';
import { TarUtility } from '../common/tar-utility';
import { TarHeaderUtility } from '../header/tar-header-utility';

export namespace TarEntryUtility {

	/**
	 * Searches through the given AsyncUint8Array for the next USTAR sector,
	 * starting at the given offset.
	 */
	export function findNextUstarSectorAsync(
		input: AsyncUint8Array,
		offset: number = 0
	): Promise<AsyncUint8ArraySearchResult | null> {
		return findInAsyncUint8Array(
			input,
			offset,
			1,
			value => TarHeaderUtility.isUstarSector(value)
		);
	}

	/**
	 * Searches the given input buffer for a USTAR header tar sector, starting at the given offset.
	 * Returns -1 if no valid header sector is found.
	 */
	export function findNextUstarSectorOffset(input: Uint8Array, offset: number = 0): number {

		const NOT_FOUND = -1;

		if (!TarUtility.isUint8Array(input)) {
			return NOT_FOUND;
		}

		const maxOffset = input.byteLength;
		let nextOffset = Math.max(0, offset);

		while (nextOffset < maxOffset && !TarHeaderUtility.isUstarSector(input, nextOffset)) {
			nextOffset = TarUtility.advanceSectorOffset(nextOffset, maxOffset);
		}

		if (nextOffset < maxOffset) {
			return nextOffset;
		}

		return NOT_FOUND;
	}
}