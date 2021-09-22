/**
 * Common pure functions for transforming tarball content.
 */
export namespace TarUtility {

	export const SECTOR_SIZE = 512;

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

	export function bytesToAscii(input: number[]): string {
		return String.fromCharCode.apply(null, input);
	}

	export function asciiToBytes(input: string): number[] {
		return toString(input).split('').map(s => s.charCodeAt(0));
	}

	export function uint8ArrayToAscii(input: Uint8Array): string {
		return bytesToAscii(Array.from(input));
	}

	export function asciiToUint8Array(input: string): Uint8Array {
		return Uint8Array.from(asciiToBytes(input));
	}

	export function parseIntSafe(value: any, radix: number = 10, defaultValue: number = 0): number {
		if (isNumber(value)) return value;
		const parsed = parseInt(value, radix);
		return isNumber(parsed) ? parsed : defaultValue;
	}

	export function advanceSectorOffset(currentOffset: number, maxOffset: number): number {
		return Math.min(maxOffset, advanceSectorOffsetUnclamped(currentOffset));
	}

	export function advanceSectorOffsetUnclamped(currentOffset: number): number {
		return roundUpSectorOffset(currentOffset + SECTOR_SIZE);
	}

	export function roundUpSectorOffset(currentOffset: number): number {
		return Math.ceil(currentOffset / SECTOR_SIZE) * SECTOR_SIZE;
	}

	export function removeTrailingZeros(str: string): string {
		const pattern = /^([^\u0000\0]*)[\u0000\0]*$/;
		const result = pattern.exec(str);
		return result ? result[1] : str;
	}
}