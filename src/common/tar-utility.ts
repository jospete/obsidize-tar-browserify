import { TarHeaderField } from './tar-header';

/**
 * Helper lambda functions for transforming tarball content.
 */
export namespace TarUtility {

	export const SECTOR_SIZE = 512;
	export const USTAR_INDICATOR_VALUE = 'ustar\0';
	export const USTAR_VERSION_VALUE = '00';

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

	export function bytesToAscii(bytes: number[]): string {
		return String.fromCharCode.apply(null, bytes);
	}

	export function asciiToBytes(str: string): number[] {
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

	export function sliceFieldAscii(field: TarHeaderField, input: Uint8Array, offset?: number): string {
		return bytesToAscii(Array.from(sliceFieldBuffer(field, input, offset)));
	}

	export function advanceSectorOffset(currentOffset: number, maxOffset: number): number {
		return Math.min(maxOffset, advanceSectorOffsetUnclamped(currentOffset));
	}

	export function removeTrailingZeros(str: string): string {
		const pattern = /^([^\u0000\0]*)[\u0000\0]*$/;
		const result = pattern.exec(str);
		return result ? result[1] : str;
	}

	export function advanceSectorOffsetUnclamped(currentOffset: number): number {

		const intVal = Math.round(currentOffset);
		const nextOffsetRaw = intVal + SECTOR_SIZE;
		const diffToBoundary = nextOffsetRaw % SECTOR_SIZE;

		return nextOffsetRaw - diffToBoundary;
	}

	export function roundUpSectorOffset(currentOffset: number): number {

		const intVal = Math.round(currentOffset);
		const diffToBoundary = intVal % SECTOR_SIZE;

		if (diffToBoundary > 0) {
			return intVal + (SECTOR_SIZE - diffToBoundary);
		}

		return intVal;
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
}