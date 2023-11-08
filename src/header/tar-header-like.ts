import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';

/**
 * Core content parsed from a tar header sector.
 */
export interface TarHeaderLike {
	fileName: string;
	fileMode: number;
	ownerUserId: number;
	groupUserId: number;
	fileSize: number;
	lastModified: number;
	headerChecksum: number;
	linkedFileName: string;
	typeFlag: TarHeaderLinkIndicatorType;
	ustarIndicator: string;
	ustarVersion: string;
	ownerUserName: string;
	ownerGroupName: string;
	deviceMajorNumber: string;
	deviceMinorNumber: string;
	fileNamePrefix: string;
}