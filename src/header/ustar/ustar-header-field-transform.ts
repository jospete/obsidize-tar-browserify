import { Constants } from '../../common/constants';
import { TarUtility } from '../../common/tar-utility';
import { UstarHeaderFieldType } from './ustar-header-field-type';

/**
 * Generalized transformation interface for header fields.
 * Used TarHeader getter/setter functionality.
 */
export interface UstarHeaderFieldTransform<T> {
	serialize(input: T, fieldLength: number): Uint8Array;
	deserialize(input: Uint8Array, fieldLength: number, offset: number): T;
}

export namespace UstarHeaderFieldTransformType {
	function serializeIntegerOctalToString(value: number, maxLength: number): string {
		return TarUtility.parseIntSafe(value)
			.toString(Constants.OCTAL_RADIX)
			.padStart(maxLength, '0')
			.substring(0, maxLength);
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
	
	function serializeAsciiPadded(input: string, fieldLength: number): Uint8Array {
		input = String(input);
		if (input.length > fieldLength) {
			return TarUtility.encodeString(input.substring(0, fieldLength - 1) + '\0');
		}
		return TarUtility.encodeString(input.padEnd(fieldLength, '\0'));
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
		return serializeIntegerOctalWithSuffix(TarUtility.dateTimeToUstar(value), fieldLength, '');
	}
	
	function deserializeIntegerOctalTimestamp(input: Uint8Array, fieldLength: number, offset: number): number {
		return TarUtility.ustarTimeToDate(deserializeIntegerOctal(input, fieldLength, offset));
	}
	
	export const ASCII: UstarHeaderFieldTransform<string> = Object.freeze({
		serialize: serializeAscii,
		deserialize: deserializeAscii
	});
	
	export const ASCII_PADDED_END: UstarHeaderFieldTransform<string> = Object.freeze({
		serialize: serializeAsciiPadded,
		deserialize: deserializeAsciiPadded
	});
	
	export const INTEGER_OCTAL: UstarHeaderFieldTransform<number> = Object.freeze({
		serialize: serializeIntegerOctal,
		deserialize: deserializeIntegerOctal
	});
	
	export const INTEGER_OCTAL_TIMESTAMP: UstarHeaderFieldTransform<number> = Object.freeze({
		serialize: serializeIntegerOctalTimestamp,
		deserialize: deserializeIntegerOctalTimestamp
	});

	export function from(fieldType: UstarHeaderFieldType): UstarHeaderFieldTransform<any> | undefined {
		switch (fieldType) {
			case UstarHeaderFieldType.ASCII:
				return ASCII;
			case UstarHeaderFieldType.ASCII_PADDED_END:
				return ASCII_PADDED_END;
			case UstarHeaderFieldType.INTEGER_OCTAL:
				return INTEGER_OCTAL;
			case UstarHeaderFieldType.INTEGER_OCTAL_TIMESTAMP:
				return INTEGER_OCTAL_TIMESTAMP;
			default:
				return undefined;
		}
	}
}
