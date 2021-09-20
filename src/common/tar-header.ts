import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';

/**
 * Core content parsed from a tar header sector.
 */
export interface TarHeader {

	// Legacy Fields
	fileName: string;
	fileMode: string;
	ownerUserId: number;
	groupUserId: number;
	fileSize: number;
	lastModified: number;
	headerChecksum: string;
	linkedFileName: string;
	typeFlag: TarHeaderLinkIndicatorType | string;

	// USTAR Fields
	ustarIndicator: string;
	ustarVersion: string;
	ownerUserName: string;
	ownerGroupName: string;
	deviceMajorNumber: string;
	deviceMinorNumber: string;
	fileNamePrefix: string;
}