import { TarHeaderField, TarHeaderFieldDefinition, TarHeaderFieldType } from './tar-header';

/**
 * Helper lambda functions for transforming tarball content.
 */
export namespace TarUtility {

	export const SECTOR_SIZE = 512;
	export const USTAR_INDICATOR_VALUE = 'ustar\0';
	export const USTAR_VERSION_VALUE = '00';

	// -------------------- Common Utils -------------------------

	export function isNumber(value: any): boolean {
		return typeof value === 'number' && !Number.isNaN(value);
	}

	export function isUint8Array(value: any): boolean {
		return !!(value && value instanceof Uint8Array);
	}

	export function toString(value: any): string {
		return value + '';
	}

	export function toArray<T>(value: T[]): T[] {
		return [].slice.call(value);
	}

	export function clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(value, max));
	}

	export function parseCharCodes(str: string): number[] {
		return toString(str).split('').map(c => c.charCodeAt(0));
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

	export function padBytesEnd(bytes: number[], targetSize: number, padValue: number = 0): number[] {

		const result = toArray(bytes);
		const currentLength = result.length;

		if (currentLength >= targetSize) {
			return result.slice(0, targetSize);
		}

		for (let i = currentLength; i < targetSize; i++) {
			result.push(padValue);
		}

		return result;
	}

	export function createFixedSizeUint8Array(bytes: number[], size: number, padValue: number = 0): Uint8Array {

		const valueByteCount = bytes.length;
		const result = new Uint8Array(size);
		const safeBytes = valueByteCount <= size ? bytes : toArray(bytes).slice(0, size);

		result.set(safeBytes, 0);

		if (valueByteCount < size) {
			result.fill(padValue, valueByteCount, size);
		}

		return result;
	}

	export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {

		const safeArrays = toArray(arrays).filter(v => isUint8Array(v));
		const totalLength = safeArrays.reduce((acc: number, arr: Uint8Array) => acc + arr.length, 0);
		const safeTotalLength = Math.max(0, totalLength);
		const result = new Uint8Array(safeTotalLength);

		if (safeTotalLength <= 0) {
			return result;
		}

		let offset = 0;

		for (const array of safeArrays) {

			const size = array.length;
			if (size <= 0) continue;

			result.set(array, offset);
			offset += size;
		}

		return result;
	}

	// -------------------- Header Field Parsers -------------------------

	export function isUstarSector(input: Uint8Array, offset: number): boolean {
		return readFieldValue(TarHeaderFieldDefinition.ustarIndicator(), input, offset) === USTAR_INDICATOR_VALUE;
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

	// -------------------- Header Field Encoders -------------------------

	export function unparseAsciiFixed(input: string, byteCount: number): Uint8Array {
		return createFixedSizeUint8Array(parseCharCodes(input), byteCount);
	}

	export function unparseIntegerOctalField(value: number, byteCount: number): Uint8Array {

		// NOTE: Octal strings in tar files are front-padded with zeroes and have one space at the end

		const maxOctalLength = byteCount - 1;

		const valueOctalStr = parseIntSafe(value)
			.toString(8)
			.substring(0, maxOctalLength)
			.padStart(maxOctalLength, '0');

		return unparseAsciiFixed(valueOctalStr + '\0', byteCount);
	}

	export function unparseFieldValue(field: TarHeaderField, input: any): Uint8Array {
		const { type, size } = field;
		switch (type) {
			case TarHeaderFieldType.INTEGER_OCTAL:
				return unparseIntegerOctalField(input, size);
			case TarHeaderFieldType.INTEGER_OCTAL_ASCII:
			case TarHeaderFieldType.ASCII_TRIMMED:
			case TarHeaderFieldType.ASCII:
			default:
				return unparseAsciiFixed(input, size);
		}
	}
}