import { Constants } from '../common/constants.ts';
import { TarUtility } from '../common/tar-utility.ts';
import { UstarHeaderField } from './ustar/ustar-header-field.ts';
import { UstarHeaderLinkIndicatorType } from './ustar/ustar-header-link-indicator-type.ts';

export namespace TarHeaderUtility {
	export const CHECKSUM_SEED_STRING = ''.padStart(UstarHeaderField.headerChecksum.size, ' ');
	export const CHECKSUM_SEED = TarUtility.generateChecksum(TarUtility.encodeString(CHECKSUM_SEED_STRING));
	export const ALL_FIELDS = UstarHeaderField.all();
	export const CHECKSUM_FIELDS = UstarHeaderField.checksumSet();

	export function isUstarSector(input: Uint8Array, offset?: number): boolean {
		return UstarHeaderField.ustarIndicator.sliceString(input, offset).startsWith(Constants.USTAR_TAG);
	}

	export function isTarHeaderLinkIndicatorTypeDirectory(type: UstarHeaderLinkIndicatorType | string): boolean {
		return type === UstarHeaderLinkIndicatorType.DIRECTORY;
	}

	export function isTarHeaderLinkIndicatorTypeFile(type: UstarHeaderLinkIndicatorType | string): boolean {
		switch (type) {
			case UstarHeaderLinkIndicatorType.NORMAL_FILE:
			case UstarHeaderLinkIndicatorType.NORMAL_FILE_ALT1:
			case UstarHeaderLinkIndicatorType.NORMAL_FILE_ALT2:
			case UstarHeaderLinkIndicatorType.CONTIGUOUS_FILE:
				return true;
			default:
				return false;
		}
	}

	export function isTarHeaderLinkIndicatorTypePax(type: UstarHeaderLinkIndicatorType | string): boolean {
		switch (type) {
			case UstarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER:
			case UstarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER:
				return true;
			default:
				return false;
		}
	}

	/**
	 * Searches the given input buffer for a USTAR header tar sector, starting at the given offset.
	 * Returns -1 if no valid header sector is found.
	 */
	export function findNextUstarSectorOffset(input: Uint8Array | null, offset: number = 0): number {
		const NOT_FOUND = -1;

		if (!TarUtility.isUint8Array(input)) {
			return NOT_FOUND;
		}

		const maxOffset = input.byteLength;
		let nextOffset = Math.max(0, offset);

		while (nextOffset < maxOffset && !isUstarSector(input, nextOffset)) {
			nextOffset = TarUtility.advanceSectorOffset(nextOffset, maxOffset);
		}

		if (nextOffset < maxOffset) {
			return nextOffset;
		}

		return NOT_FOUND;
	}
}
