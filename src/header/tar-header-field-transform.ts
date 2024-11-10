import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeaderFieldType } from './tar-header-field-type';

/**
 * Generalized transformation interface for header fields.
 * Used TarHeader getter/setter functionality.
 */
export interface TarHeaderFieldTransform<T> {
	serialize(input: T, fieldLength: number): Uint8Array;
	deserialize(input: Uint8Array, fieldLength: number, offset: number): T;
}

export namespace TarHeaderFieldTransformType {
	function serializeIntegerOctalToString(value: number, maxLength: number): string {
		return TarUtility.parseIntSafe(value)
			.toString(Constants.OCTAL_RADIX)
			.padStart(maxLength, '0');
	}
	
	function serializeIntegerOctalWithSuffix(
		value: number, 
		fieldLength: number, 
		suffix: string
	): Uint8Array {
	
		const adjustedLength = Math.max(0, fieldLength - 1 - suffix.length);
	
		// USTAR docs indicate that value length needs to be 1 less than actual field size.
		// We also need to allow for suffixes... because random white spaces.
		const serializedString = serializeIntegerOctalToString(value, adjustedLength) + suffix;
	
		return TarUtility.encodeString(serializedString);
	}
	
	function getScopedBytes(input: Uint8Array, fieldLength: number, offset: number): Uint8Array {
		return input.slice(offset, offset + fieldLength);
	}
	
	function serializeAscii(input: string, fieldLength: number): Uint8Array {
		return TarUtility.encodeString(String(input).substring(0, fieldLength));
	}
	
	function deserializeAscii(input: Uint8Array, fieldLength: number, offset: number): string {
		const bytes = getScopedBytes(input, fieldLength, offset);
		return TarUtility.decodeString(bytes);
	}
	
	function deserializeAsciiPadded(input: Uint8Array, fieldLength: number, offset: number): string {
		const bytes = getScopedBytes(input, fieldLength, offset);
		return TarUtility.removeTrailingZeros(TarUtility.decodeString(bytes));
	}
	
	function serializeIntegerOctal(value: number, fieldLength: number): Uint8Array {
		return serializeIntegerOctalWithSuffix(value, fieldLength, ' ');
	}
	
	function deserializeIntegerOctal(input: Uint8Array, fieldLength: number, offset: number): number {
		const bytes = getScopedBytes(input, fieldLength, offset);
		return TarUtility.parseIntSafe(TarUtility.decodeString(bytes).trim(), Constants.OCTAL_RADIX);
	}
	
	function serializeIntegerOctalTimestamp(value: number, fieldLength: number): Uint8Array {
		return serializeIntegerOctalWithSuffix(TarUtility.encodeTimestamp(value), fieldLength, '');
	}
	
	function deserializeIntegerOctalTimestamp(input: Uint8Array, fieldLength: number, offset: number): number {
		return TarUtility.decodeTimestamp(deserializeIntegerOctal(input, fieldLength, offset));
	}
	
	export const ASCII: TarHeaderFieldTransform<string> = Object.freeze({
		serialize: serializeAscii,
		deserialize: deserializeAscii
	});
	
	export const ASCII_PADDED_END: TarHeaderFieldTransform<string> = Object.freeze({
		serialize: serializeAscii,
		deserialize: deserializeAsciiPadded
	});
	
	export const INTEGER_OCTAL: TarHeaderFieldTransform<number> = Object.freeze({
		serialize: serializeIntegerOctal,
		deserialize: deserializeIntegerOctal
	});
	
	export const INTEGER_OCTAL_TIMESTAMP: TarHeaderFieldTransform<number> = Object.freeze({
		serialize: serializeIntegerOctalTimestamp,
		deserialize: deserializeIntegerOctalTimestamp
	});

	export function from(fieldType: TarHeaderFieldType): TarHeaderFieldTransform<any> | undefined {
		switch (fieldType) {
			case TarHeaderFieldType.ASCII:
				return ASCII;
			case TarHeaderFieldType.ASCII_PADDED_END:
				return ASCII_PADDED_END;
			case TarHeaderFieldType.INTEGER_OCTAL:
				return INTEGER_OCTAL;
			case TarHeaderFieldType.INTEGER_OCTAL_TIMESTAMP:
				return INTEGER_OCTAL_TIMESTAMP;
			default:
				return undefined;
		}
	}
}
