import { TarHeader } from './tar-header';
import { TarHeaderField } from './tar-header-field';
import { TarHeaderFieldType } from './tar-header-field-type';

/**
 * Definitions taken from here:
 * https://en.wikipedia.org/wiki/Tar_(computing)
 */
export namespace TarHeaderFieldDefinition {

	export const USTAR_TAG = 'ustar';

	// Legacy Fields
	export const fileName: TarHeaderField = Object.freeze({ name: 'fileName', offset: 0, size: 100, type: TarHeaderFieldType.ASCII_PADDED_END });
	export const fileMode: TarHeaderField = Object.freeze({ name: 'fileMode', offset: 100, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL });
	export const ownerUserId: TarHeaderField = Object.freeze({ name: 'ownerUserId', offset: 108, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL });
	export const groupUserId: TarHeaderField = Object.freeze({ name: 'groupUserId', offset: 116, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL });
	export const fileSize: TarHeaderField = Object.freeze({ name: 'fileSize', offset: 124, size: 12, type: TarHeaderFieldType.INTEGER_OCTAL });
	export const lastModified: TarHeaderField = Object.freeze({ name: 'lastModified', offset: 136, size: 12, type: TarHeaderFieldType.INTEGER_OCTAL_TIMESTAMP });
	export const headerChecksum: TarHeaderField = Object.freeze({ name: 'headerChecksum', offset: 148, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL });
	export const typeFlag: TarHeaderField = Object.freeze({ name: 'typeFlag', offset: 156, size: 1, type: TarHeaderFieldType.ASCII });
	export const linkedFileName: TarHeaderField = Object.freeze({ name: 'linkedFileName', offset: 157, size: 100, type: TarHeaderFieldType.ASCII_PADDED_END });

	// USTAR Fields
	export const ustarIndicator: TarHeaderField = Object.freeze({ name: 'ustarIndicator', offset: 257, size: 6, type: TarHeaderFieldType.ASCII, constantValue: `${USTAR_TAG}\0` });
	export const ustarVersion: TarHeaderField = Object.freeze({ name: 'ustarVersion', offset: 263, size: 2, type: TarHeaderFieldType.ASCII, constantValue: '00' });
	export const ownerUserName: TarHeaderField = Object.freeze({ name: 'ownerUserName', offset: 265, size: 32, type: TarHeaderFieldType.ASCII_PADDED_END });
	export const ownerGroupName: TarHeaderField = Object.freeze({ name: 'ownerGroupName', offset: 297, size: 32, type: TarHeaderFieldType.ASCII_PADDED_END });
	export const deviceMajorNumber: TarHeaderField = Object.freeze({ name: 'deviceMajorNumber', offset: 329, size: 8, type: TarHeaderFieldType.ASCII_PADDED_END });
	export const deviceMinorNumber: TarHeaderField = Object.freeze({ name: 'deviceMinorNumber', offset: 337, size: 8, type: TarHeaderFieldType.ASCII_PADDED_END });
	export const fileNamePrefix: TarHeaderField = Object.freeze({ name: 'fileNamePrefix', offset: 345, size: 155, type: TarHeaderFieldType.ASCII_PADDED_END });

	const fieldsByName: { [key in keyof TarHeader]: TarHeaderField } = {
		fileName,
		fileMode,
		ownerUserId,
		groupUserId,
		fileSize,
		lastModified,
		headerChecksum,
		typeFlag,
		linkedFileName,
		ustarIndicator,
		ustarVersion,
		ownerUserName,
		ownerGroupName,
		deviceMajorNumber,
		deviceMinorNumber,
		fileNamePrefix
	};

	export function orderedSet(): TarHeaderField[] {
		return Object.values(fieldsByName);
	}

	export function checksumSet(): TarHeaderField[] {
		return orderedSet().filter(v => v !== headerChecksum);
	}
}