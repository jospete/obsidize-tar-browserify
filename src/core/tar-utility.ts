import { TarHeaderField, TarHeaderFieldDefinition, TarHeaderFieldType } from './tar-header';

/**
 * Helper lambda functions for parsing tarball content.
 */
export namespace TarUtility {

	export const BLOCK_SIZE = 512;
	export const USTAR_SECTOR_TAG = 'ustar\0';

	export const parseAscii = (input: Uint8Array): string => {
		return String.fromCharCode.apply(null, Array.from(input));
	};

	export const isNumber = (value: any): boolean => {
		return typeof value === 'number' && !Number.isNaN(value);
	};

	export const parseIntSafe = (value: any, radix: number = 10, defaultValue: number = 0): number => {
		if (isNumber(value)) return value;
		const parsed = parseInt(value, radix);
		return isNumber(parsed) ? parsed : defaultValue;
	};

	export const sliceFieldBuffer = (field: TarHeaderField, input: Uint8Array, offset: number = 0): Uint8Array => {
		const absoluteOffset = field.offset + offset;
		return input.slice(absoluteOffset, absoluteOffset + field.size);
	};

	export const parseAsciiOctalNumberField = (input: Uint8Array): number => {
		return parseIntSafe(parseAscii(input), 8);
	};

	export const parseNumberField = (input: Uint8Array): number => {
		return new DataView(input).getFloat64(0);
	};

	export const readFieldValue = (field: TarHeaderField, input: Uint8Array, offset?: number): any => {
		return parseFieldValueByType(field.type, sliceFieldBuffer(field, input, offset));
	};

	export const isUstarSector = (input: Uint8Array, offset: number): boolean => {
		return readFieldValue(TarHeaderFieldDefinition.ustarIndicator(), input, offset) === USTAR_SECTOR_TAG;
	};

	export const advanceSectorOffset = (currentOffset: number, maxOffset: number): number => {
		const nextOffsetRaw = Math.round(currentOffset) + BLOCK_SIZE;
		const diffToBoundary = nextOffsetRaw % BLOCK_SIZE;
		return Math.min(maxOffset, nextOffsetRaw - diffToBoundary);
	};

	export const parseFieldValueByType = (fieldType: TarHeaderFieldType, input: Uint8Array): any => {
		switch (fieldType) {
			case TarHeaderFieldType.ASCII:
				return parseAscii(input);
			case TarHeaderFieldType.INTEGER_OCTAL:
				return parseAsciiOctalNumberField(input);
			default:
				return parseNumberField(input);
		}
	};
}