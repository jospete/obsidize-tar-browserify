import {
	decodeString,
	deserializeAsciiPaddedField,
	deserializeIntegerOctal,
	deserializeIntegerOctalTimestamp,
	encodeString,
	encodeTimestamp,
	isUint8Array,
	serializeIntegerOctalToString,
	sizeofUint8Array
} from '../common/transforms';

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

function serializeIntegerOctalTimestamp(value: number, field: TarHeaderFieldLike): Uint8Array {
	return serializeIntegerOctalWithSuffix(encodeTimestamp(value), field, '');
}

function serializeIntegerOctal(value: number, field: TarHeaderFieldLike): Uint8Array {
	return serializeIntegerOctalWithSuffix(value, field, ' ');
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

	/**
	 * Creates an immutable field instance based on the given config.
	 */
	public static frozen(config: TarHeaderFieldLike): TarHeaderField {
		return Object.freeze(new TarHeaderField(config));
	}

	/**
	 * Shorthand for padding the output of `slice` into `decodeString`.
	 */
	public sliceString(input: Uint8Array, offset?: number): string {
		return decodeString(this.slice(input, offset));
	}

	/**
	 * @param input - a buffer of one or more complete tar sectors
	 * @param offset - the offset to slice from (must be a multiple of `SECTOR_SIZE`)
	 * @returns the slice of the given input Uint8Array that this field resides in.
	 */
	public slice(input: Uint8Array, offset: number = 0): Uint8Array {
		if (!isUint8Array(input)) return new Uint8Array(0);
		const start = offset + this.offset;
		const end = start + this.size;
		return input.slice(start, end);
	}

	/**
	 * @param input - a buffer of one or more complete tar sectors
	 * @returns The value parsed from the input based on this field's transform type,
	 * or `undefined` on error.
	 */
	public deserialize<T = any>(input: Uint8Array): T | undefined {
		const transform = fieldTypeTransformMap[this.type];
		return (transform && isUint8Array(input))
			? transform.deserialize(input, this)
			: undefined;
	}

	/**
	 * @param input - the value to be serialized, based on this field's transform type.
	 * @returns the serialized value as a Uint8Array
	 */
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