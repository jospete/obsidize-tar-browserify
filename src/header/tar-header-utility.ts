import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeader } from './tar-header';
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

	export function sanitizeHeader(header: Partial<TarHeader> | null): TarHeader {

		if (header && TarUtility.isNumber(header.lastModified)) {
			header.lastModified = TarUtility.sanitizeTimestamp(header.lastModified!);
		}

		return Object.assign(getDefaultHeaderValues(), (header || {})) as TarHeader;
	}

	export function getDefaultHeaderValues(): TarHeader {
		return {
			fileName: '',
			fileMode: Constants.FILE_MODE_DEFAULT,
			groupUserId: 0,
			ownerUserId: 0,
			fileSize: 0,
			lastModified: TarUtility.sanitizeTimestamp(Date.now()),
			headerChecksum: 0,
			linkedFileName: '',
			typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE,
			ustarIndicator: Constants.USTAR_INDICATOR_VALUE,
			ustarVersion: Constants.USTAR_VERSION_VALUE,
			ownerUserName: '',
			ownerGroupName: '',
			deviceMajorNumber: '00',
			deviceMinorNumber: '00',
			fileNamePrefix: ''
		};
	}
}