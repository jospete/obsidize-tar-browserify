export enum TarHeaderFieldType {
	ASCII = 'ASCII',
	INTEGER = 'INTEGER',
	INTEGER_OCTAL = 'INTEGER_OCTAL',
}

export enum TarHeaderLinkIndicatorType {
	NORMAL_FILE = '0',
	HARD_LINK = '1',
	SYMBOLIC_LINK = '2',
	CHARACTER_SPECIAL = '3',
	BLOCK_SPECIAL = '4',
	DIRECTORY = '5',
	FIFO = '6',
	CONTIGUOUS_FILE = '7',
	GLOBAL_EXTENDED_HEADER = 'g',
	LOCAL_EXTENDED_HEADER = 'x'
}

export interface TarHeader {
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
	deviceMajorNumber: number;
	deviceMinorNumber: number;
	fileNamePrefix: string;
}

export interface TarHeaderField {
	name: keyof TarHeader;
	offset: number;
	size: number;
	type: TarHeaderFieldType;
}

/**
 * Definitions taken from here:
 * https://en.wikipedia.org/wiki/Tar_(computing)
 */
export namespace TarHeaderFieldDefinition {

	export const fileName = (): TarHeaderField => ({ name: 'fileName', offset: 0, size: 100, type: TarHeaderFieldType.ASCII });
	export const fileMode = (): TarHeaderField => ({ name: 'fileMode', offset: 100, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL });
	export const ownerUserId = (): TarHeaderField => ({ name: 'ownerUserId', offset: 108, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL });
	export const groupUserId = (): TarHeaderField => ({ name: 'groupUserId', offset: 116, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL });
	export const fileSize = (): TarHeaderField => ({ name: 'fileSize', offset: 124, size: 12, type: TarHeaderFieldType.INTEGER_OCTAL });
	export const lastModified = (): TarHeaderField => ({ name: 'lastModified', offset: 136, size: 12, type: TarHeaderFieldType.INTEGER_OCTAL });
	export const headerChecksum = (): TarHeaderField => ({ name: 'headerChecksum', offset: 148, size: 8, type: TarHeaderFieldType.INTEGER });
	export const typeFlag = (): TarHeaderField => ({ name: 'typeFlag', offset: 156, size: 1, type: TarHeaderFieldType.ASCII });
	export const linkedFileName = (): TarHeaderField => ({ name: 'linkedFileName', offset: 157, size: 100, type: TarHeaderFieldType.ASCII });

	// USTAR Fields
	export const ustarIndicator = (): TarHeaderField => ({ name: 'ustarIndicator', offset: 257, size: 6, type: TarHeaderFieldType.ASCII });
	export const ustarVersion = (): TarHeaderField => ({ name: 'ustarVersion', offset: 263, size: 2, type: TarHeaderFieldType.ASCII });
	export const ownerUserName = (): TarHeaderField => ({ name: 'ownerUserName', offset: 265, size: 32, type: TarHeaderFieldType.ASCII });
	export const ownerGroupName = (): TarHeaderField => ({ name: 'ownerGroupName', offset: 297, size: 32, type: TarHeaderFieldType.ASCII });
	export const deviceMajorNumber = (): TarHeaderField => ({ name: 'deviceMajorNumber', offset: 329, size: 8, type: TarHeaderFieldType.INTEGER });
	export const deviceMinorNumber = (): TarHeaderField => ({ name: 'deviceMinorNumber', offset: 337, size: 8, type: TarHeaderFieldType.INTEGER });
	export const fileNamePrefix = (): TarHeaderField => ({ name: 'fileNamePrefix', offset: 345, size: 155, type: TarHeaderFieldType.ASCII });

	export const orderedSet = (): TarHeaderField[] => [
		fileName(),
		fileMode(),
		ownerUserId(),
		groupUserId(),
		fileSize(),
		lastModified(),
		headerChecksum(),
		typeFlag(),
		linkedFileName(),
		ustarIndicator(),
		ustarVersion(),
		ownerUserName(),
		ownerGroupName(),
		deviceMajorNumber(),
		deviceMinorNumber(),
		fileNamePrefix()
	];
}