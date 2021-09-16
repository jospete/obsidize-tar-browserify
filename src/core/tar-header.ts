export enum TarHeaderFieldType {
	ASCII = 'ASCII',
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
	LOCAL_EXTENDED_HEADER = 'x',
	UNKNOWN = 'UNKNOWN'
}

export interface TarHeader {

	// Legacy Fields
	readonly fileName: string;
	readonly fileMode: number;
	readonly ownerUserId: number;
	readonly groupUserId: number;
	readonly fileSize: number;
	readonly lastModified: number;
	readonly headerChecksum: number;
	readonly linkedFileName: string;
	readonly typeFlag: TarHeaderLinkIndicatorType;

	// USTAR Fields
	readonly ustarIndicator: string;
	readonly ustarVersion: string;
	readonly ownerUserName: string;
	readonly ownerGroupName: string;
	readonly deviceMajorNumber: number;
	readonly deviceMinorNumber: number;
	readonly fileNamePrefix: string;
}

export interface TarHeaderField {
	readonly name: keyof TarHeader;
	readonly offset: number;
	readonly size: number;
	readonly type: TarHeaderFieldType;
}

/**
 * Definitions taken from here:
 * https://en.wikipedia.org/wiki/Tar_(computing)
 */
export namespace TarHeaderFieldDefinition {

	// Legacy Fields
	export function fileName(): TarHeaderField { return ({ name: 'fileName', offset: 0, size: 100, type: TarHeaderFieldType.ASCII }) }
	export function fileMode(): TarHeaderField { return ({ name: 'fileMode', offset: 100, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function ownerUserId(): TarHeaderField { return ({ name: 'ownerUserId', offset: 108, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function groupUserId(): TarHeaderField { return ({ name: 'groupUserId', offset: 116, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function fileSize(): TarHeaderField { return ({ name: 'fileSize', offset: 124, size: 12, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function lastModified(): TarHeaderField { return ({ name: 'lastModified', offset: 136, size: 12, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function headerChecksum(): TarHeaderField { return ({ name: 'headerChecksum', offset: 148, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function typeFlag(): TarHeaderField { return ({ name: 'typeFlag', offset: 156, size: 1, type: TarHeaderFieldType.ASCII }) }
	export function linkedFileName(): TarHeaderField { return ({ name: 'linkedFileName', offset: 157, size: 100, type: TarHeaderFieldType.ASCII }) }

	// USTAR Fields
	export function ustarIndicator(): TarHeaderField { return ({ name: 'ustarIndicator', offset: 257, size: 6, type: TarHeaderFieldType.ASCII }) }
	export function ustarVersion(): TarHeaderField { return ({ name: 'ustarVersion', offset: 263, size: 2, type: TarHeaderFieldType.ASCII }) }
	export function ownerUserName(): TarHeaderField { return ({ name: 'ownerUserName', offset: 265, size: 32, type: TarHeaderFieldType.ASCII }) }
	export function ownerGroupName(): TarHeaderField { return ({ name: 'ownerGroupName', offset: 297, size: 32, type: TarHeaderFieldType.ASCII }) }
	export function deviceMajorNumber(): TarHeaderField { return ({ name: 'deviceMajorNumber', offset: 329, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function deviceMinorNumber(): TarHeaderField { return ({ name: 'deviceMinorNumber', offset: 337, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function fileNamePrefix(): TarHeaderField { return ({ name: 'fileNamePrefix', offset: 345, size: 155, type: TarHeaderFieldType.ASCII }) }

	export function orderedSet(): TarHeaderField[] {
		return [
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
}