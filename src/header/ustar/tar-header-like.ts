import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';

/**
 * Core content parsed from a tar header sector.
 */
export interface TarHeaderLike {
	readonly fileName: string;
	readonly fileMode: number;
	readonly ownerUserId: number;
	readonly groupUserId: number;
	readonly fileSize: number;
	readonly lastModified: number;
	readonly headerChecksum: number;
	readonly linkedFileName: string;
	readonly typeFlag: TarHeaderLinkIndicatorType;
	readonly ustarIndicator: string;
	readonly ustarVersion: string;
	readonly ownerUserName: string;
	readonly ownerGroupName: string;
	readonly deviceMajorNumber: string;
	readonly deviceMinorNumber: string;
	readonly fileNamePrefix: string;
}
