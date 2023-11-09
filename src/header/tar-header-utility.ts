import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeaderField } from './tar-header-field';
import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';

export namespace TarHeaderUtility {

	export const CHECKSUM_SEED_STRING = ''.padStart(TarHeaderField.headerChecksum.size, ' ');
	export const CHECKSUM_SEED = TarUtility.generateChecksum(TarUtility.encodeString(CHECKSUM_SEED_STRING));
	export const ALL_FIELDS = TarHeaderField.all();
	export const CHECKSUM_FIELDS = TarHeaderField.checksumSet();

	export function isUstarSector(input: Uint8Array, offset?: number): boolean {
		return TarHeaderField.ustarIndicator.sliceString(input, offset).startsWith(Constants.USTAR_TAG);
	}

	export function isTarHeaderLinkIndicatorTypeDirectory(type: TarHeaderLinkIndicatorType | string): boolean {
		return type === TarHeaderLinkIndicatorType.DIRECTORY;
	}
	
	export function isTarHeaderLinkIndicatorTypeFile(type: TarHeaderLinkIndicatorType | string): boolean {
		switch (type) {
			case TarHeaderLinkIndicatorType.NORMAL_FILE:
			case TarHeaderLinkIndicatorType.NORMAL_FILE_ALT1:
			case TarHeaderLinkIndicatorType.NORMAL_FILE_ALT2:
			case TarHeaderLinkIndicatorType.CONTIGUOUS_FILE:
				return true;
			default:
				return false;
		}
	}

	export function isTarHeaderLinkIndicatorTypePax(type: TarHeaderLinkIndicatorType | string): boolean {
		switch (type) {
			case TarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER:
			case TarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER:
				return true;
			default:
				return false;
		}
	}
}