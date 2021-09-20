import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';

/**
 * Core content parsed from a tar header sector.
 */
export interface TarHeader {
	fileName: string;
	fileMode: string;
	ownerUserId: number;
	groupUserId: number;
	fileSize: number;
	lastModified: number;
	headerChecksum: string;
	linkedFileName: string;
	typeFlag: TarHeaderLinkIndicatorType | string;
	ustarIndicator: string;
	ustarVersion: string;
	ownerUserName: string;
	ownerGroupName: string;
	deviceMajorNumber: string;
	deviceMinorNumber: string;
	fileNamePrefix: string;
	padding: string;
}