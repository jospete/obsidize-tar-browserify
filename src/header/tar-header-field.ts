import {
	decodeString,
	decodeTimestamp,
	encodeString,
	encodeTimestamp,
	isUint8Array,
	parseIntSafe,
	removeTrailingZeros,
	sizeofUint8Array,
	USTAR_INDICATOR_VALUE,
	USTAR_TAG,
	USTAR_VERSION_VALUE
} from '../common';

import { TarHeader } from './tar-header';
import { TarHeaderFieldType } from './tar-header-field-type';

/**
 * Metadata about a single field for a tar header.
 * These are used to dynamically parse fields as a header sector is stepped through.
 * 
 * See extractTarEntry() and TarUtility for more info.
 */
export interface TarHeaderFieldLike {
	readonly name: keyof TarHeader;
	readonly offset: number;
	readonly size: number;
	readonly type: TarHeaderFieldType;
	constantValue?: any;
}

const OCTAL_RADIX = 8;

export function deserializeAsciiPaddedField(value: Uint8Array): string {
	return removeTrailingZeros(decodeString(value));
}

export function deserializeIntegerOctal(input: Uint8Array): number {
	return parseIntSafe(decodeString(input).trim(), OCTAL_RADIX);
}

export function serializeIntegerOctalTimestamp(value: number, field: TarHeaderFieldLike): Uint8Array {
	return serializeIntegerOctalWithSuffix(encodeTimestamp(value), field, '');
}

export function deserializeIntegerOctalTimestamp(value: Uint8Array): number {
	return decodeTimestamp(deserializeIntegerOctal(value));
}

export function serializeIntegerOctal(value: number, field: TarHeaderFieldLike): Uint8Array {
	return serializeIntegerOctalWithSuffix(value, field, ' ');
}

export function serializeIntegerOctalToString(value: number, maxLength: number): string {
	return parseIntSafe(value)
		.toString(OCTAL_RADIX)
		.padStart(maxLength, '0');
}

export function serializeIntegerOctalWithSuffix(value: number, field: TarHeaderFieldLike, suffix: string): Uint8Array {

	const { size } = (field || { size: 0 });
	const adjustedLength = Math.max(0, size - 1 - suffix.length);

	// USTAR docs indicate that value length needs to be 1 less than actual field size.
	// We also need to allow for suffixes... because random white spaces.
	const serializedString = serializeIntegerOctalToString(value, adjustedLength) + suffix;

	return encodeString(serializedString);
}

interface FieldTransform<T> {
	serialize(input: T, field: TarHeaderFieldLike): Uint8Array;
	deserialize(input: Uint8Array, field: TarHeaderFieldLike): T;
}

const fieldTypeTransformMap: { [key: string]: FieldTransform<any> } = {
	[TarHeaderFieldType.ASCII]: {
		serialize: encodeString,
		deserialize: decodeString
	},
	[TarHeaderFieldType.ASCII_PADDED_END]: {
		serialize: encodeString,
		deserialize: deserializeAsciiPaddedField
	},
	[TarHeaderFieldType.INTEGER_OCTAL]: {
		serialize: serializeIntegerOctal,
		deserialize: deserializeIntegerOctal
	},
	[TarHeaderFieldType.INTEGER_OCTAL_TIMESTAMP]: {
		serialize: serializeIntegerOctalTimestamp,
		deserialize: deserializeIntegerOctalTimestamp
	}
};

/**
 * Definitions taken from here:
 * https://en.wikipedia.org/wiki/Tar_(computing)
 */
export class TarHeaderField implements TarHeaderFieldLike {

	public readonly name: keyof TarHeader;
	public readonly offset: number;
	public readonly size: number;
	public readonly type: TarHeaderFieldType;
	public readonly constantValue: any;

	constructor(config: TarHeaderFieldLike) {
		this.name = config.name;
		this.offset = config.offset;
		this.size = config.size;
		this.type = config.type;
		this.constantValue = config.constantValue || undefined;
	}

	public static frozen(config: TarHeaderFieldLike): TarHeaderField {
		return Object.freeze(new TarHeaderField(config));
	}

	public sliceString(input: Uint8Array, offset?: number): string {
		return decodeString(this.slice(input, offset));
	}

	public slice(input: Uint8Array, offset: number = 0): Uint8Array {
		if (!isUint8Array(input)) return new Uint8Array(0);
		const absoluteOffset = this.offset + offset;
		return input.slice(absoluteOffset, absoluteOffset + this.size);
	}

	public deserialize<T = any>(input: Uint8Array): T | undefined {
		const transform = fieldTypeTransformMap[this.type];
		return (transform && isUint8Array(input))
			? transform.deserialize(input, this)
			: undefined;
	}

	public serialize(input: any): Uint8Array {

		const result = new Uint8Array(this.size);
		const transform: FieldTransform<any> = fieldTypeTransformMap[this.type];
		const value = transform.serialize(input, this);
		const valueLength = sizeofUint8Array(value);

		if (valueLength > 0 && valueLength <= this.size) {
			result.set(value!, 0);
		}

		return result;
	}
}


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