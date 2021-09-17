import { TarHeaderField, TarHeaderFieldDefinition, TarHeaderFieldType } from './tar-header';

/**
 * Helper lambda functions for parsing tarball content.
 */
export namespace TarUtility {

	export const SECTOR_SIZE = 512;
	export const USTAR_HEADER_SECTOR_TAG = 'ustar\0';

	// -------------------- Common Utils -------------------------

	export function isNumber(value: any): boolean {
		return typeof value === 'number' && !Number.isNaN(value);
	}

	export function isUint8Array(value: any): boolean {
		return !!(value && value instanceof Uint8Array);
	}

	export function clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(value, max));
	}

	export function parseIntSafe(value: any, radix: number = 10, defaultValue: number = 0): number {
		if (isNumber(value)) return value;
		const parsed = parseInt(value, radix);
		return isNumber(parsed) ? parsed : defaultValue;
	}

	export function sliceFieldBuffer(field: TarHeaderField, input: Uint8Array, offset: number = 0): Uint8Array {
		const absoluteOffset = field.offset + offset;
		return input.slice(absoluteOffset, absoluteOffset + field.size);
	}

	export function advanceSectorOffset(currentOffset: number, maxOffset: number): number {
		const nextOffsetRaw = Math.round(currentOffset) + SECTOR_SIZE;
		const diffToBoundary = nextOffsetRaw % SECTOR_SIZE;
		return Math.min(maxOffset, nextOffsetRaw - diffToBoundary);
	}

	export function removeTrailingZeros(str: string): string {
		const pattern = /^([^\u0000\0]*)[\u0000\0]*$/;
		const result = pattern.exec(str);
		return result ? result[1] : str;
	}

	// -------------------- Header Field Parsers -------------------------

	export function isUstarSector(input: Uint8Array, offset: number): boolean {
		return readFieldValue(TarHeaderFieldDefinition.ustarIndicator(), input, offset) === USTAR_HEADER_SECTOR_TAG;
	}

	export function readFieldValue(field: TarHeaderField, input: Uint8Array, offset?: number): any {
		return parseFieldValueByType(field.type, sliceFieldBuffer(field, input, offset));
	}

	export function parseAscii(input: Uint8Array): string {
		return String.fromCharCode.apply(null, Array.from(input));
	}

	export function parseAsciiTrimmed(input: Uint8Array): string {
		return removeTrailingZeros(parseAscii(input));
	}

	export function parseIntegerOctalAscii(input: Uint8Array): string {
		return parseAsciiTrimmed(input).trim();
	}

	export function parseIntegerOctal(input: Uint8Array): number {
		return parseIntSafe(parseIntegerOctalAscii(input), 8);
	}

	export function parseFieldValueByType(fieldType: TarHeaderFieldType, input: Uint8Array): any {
		switch (fieldType) {
			case TarHeaderFieldType.INTEGER_OCTAL:
				return parseIntegerOctal(input);
			case TarHeaderFieldType.INTEGER_OCTAL_ASCII:
				return parseIntegerOctalAscii(input);
			case TarHeaderFieldType.ASCII_TRIMMED:
				return parseAsciiTrimmed(input);
			case TarHeaderFieldType.ASCII:
			default:
				return parseAscii(input);
		}
	}
}