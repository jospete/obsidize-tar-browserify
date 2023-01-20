import { USTAR_INDICATOR_VALUE, USTAR_TAG, USTAR_VERSION_VALUE } from '../common';
import { TarHeader } from './tar-header';
import { TarHeaderField } from './tar-header-field';
import { TarHeaderFieldType } from './tar-header-field-type';

// =====================================================================
// Legacy Fields
// =====================================================================

export const fileName: TarHeaderField = TarHeaderField.frozen({
	name: 'fileName',
	offset: 0,
	size: 100,
	type: TarHeaderFieldType.ASCII_PADDED_END
});

export const fileMode: TarHeaderField = TarHeaderField.frozen({
	name: 'fileMode',
	offset: 100,
	size: 8,
	type: TarHeaderFieldType.INTEGER_OCTAL
});

export const ownerUserId: TarHeaderField = TarHeaderField.frozen({
	name: 'ownerUserId',
	offset: 108,
	size: 8,
	type: TarHeaderFieldType.INTEGER_OCTAL
});

export const groupUserId: TarHeaderField = TarHeaderField.frozen({
	name: 'groupUserId',
	offset: 116,
	size: 8,
	type: TarHeaderFieldType.INTEGER_OCTAL
});

export const fileSize: TarHeaderField = TarHeaderField.frozen({
	name: 'fileSize',
	offset: 124,
	size: 12,
	type: TarHeaderFieldType.INTEGER_OCTAL
});

export const lastModified: TarHeaderField = TarHeaderField.frozen({
	name: 'lastModified',
	offset: 136,
	size: 12,
	type: TarHeaderFieldType.INTEGER_OCTAL_TIMESTAMP
});

export const headerChecksum: TarHeaderField = TarHeaderField.frozen({
	name: 'headerChecksum',
	offset: 148,
	size: 8,
	type: TarHeaderFieldType.INTEGER_OCTAL
});

export const typeFlag: TarHeaderField = TarHeaderField.frozen({
	name: 'typeFlag',
	offset: 156,
	size: 1,
	type: TarHeaderFieldType.ASCII
});

export const linkedFileName: TarHeaderField = TarHeaderField.frozen({
	name: 'linkedFileName',
	offset: 157,
	size: 100,
	type: TarHeaderFieldType.ASCII_PADDED_END
});

// =====================================================================
// USTAR Fields
// =====================================================================

export const ustarIndicator: TarHeaderField = TarHeaderField.frozen({
	name: 'ustarIndicator',
	offset: 257,
	size: 6,
	type: TarHeaderFieldType.ASCII,
	constantValue: USTAR_INDICATOR_VALUE
});

export const ustarVersion: TarHeaderField = TarHeaderField.frozen({
	name: 'ustarVersion',
	offset: 263,
	size: 2,
	type: TarHeaderFieldType.ASCII,
	constantValue: USTAR_VERSION_VALUE
});

export const ownerUserName: TarHeaderField = TarHeaderField.frozen({
	name: 'ownerUserName',
	offset: 265,
	size: 32,
	type: TarHeaderFieldType.ASCII_PADDED_END
});

export const ownerGroupName: TarHeaderField = TarHeaderField.frozen({
	name: 'ownerGroupName',
	offset: 297,
	size: 32,
	type: TarHeaderFieldType.ASCII_PADDED_END
});

export const deviceMajorNumber: TarHeaderField = TarHeaderField.frozen({
	name: 'deviceMajorNumber',
	offset: 329,
	size: 8,
	type: TarHeaderFieldType.ASCII_PADDED_END
});

export const deviceMinorNumber: TarHeaderField = TarHeaderField.frozen({
	name: 'deviceMinorNumber',
	offset: 337,
	size: 8,
	type: TarHeaderFieldType.ASCII_PADDED_END
});

export const fileNamePrefix: TarHeaderField = TarHeaderField.frozen({
	name: 'fileNamePrefix',
	offset: 345,
	size: 155,
	type: TarHeaderFieldType.ASCII_PADDED_END
});

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

export function isUstarSector(input: Uint8Array, offset?: number): boolean {
	return ustarIndicator.sliceString(input, offset).startsWith(USTAR_TAG);
}