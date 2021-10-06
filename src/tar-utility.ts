/**
 * Common pure functions for transforming tarball content.
 */
export namespace TarUtility {

	export const SECTOR_SIZE = 512;

	export function isUndefined(value: any): boolean {
		return typeof value === 'undefined';
	}

	export function isDefined(value: any): boolean {
		return !isUndefined(value);
	}

	export function isNumber(value: any): boolean {
		return typeof value === 'number' && !Number.isNaN(value);
	}

	export function isUint8Array(value: any): boolean {
		return !!(value && value instanceof Uint8Array);
	}

	export function sizeofUint8Array(value: any): number {
		return isUint8Array(value) ? value.byteLength : 0;
	}

	export function toString(value: any): string {
		return value + '';
	}

	export function encodeString(value: string): Uint8Array {
		return new TextEncoder().encode(toString(value));
	}

	export function decodeString(value: Uint8Array): string {
		return isUint8Array(value) ? new TextDecoder().decode(value) : '';
	}

	export function generateChecksum(input: Uint8Array): number {
		return isUint8Array(input) ? input.reduce((a, b) => (a + b), 0) : 0;
	}

	export function clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(value, max));
	}

	export function advanceSectorOffset(currentOffset: number, maxOffset: number): number {
		return Math.min(maxOffset, advanceSectorOffsetUnclamped(currentOffset));
	}

	export function advanceSectorOffsetUnclamped(currentOffset: number): number {
		return (1 + Math.floor(currentOffset / SECTOR_SIZE)) * SECTOR_SIZE;
	}

	export function roundUpSectorOffset(currentOffset: number): number {
		return Math.ceil(currentOffset / SECTOR_SIZE) * SECTOR_SIZE;
	}

	export function getSectorOffsetDelta(currentOffset: number): number {
		return roundUpSectorOffset(currentOffset) - currentOffset;
	}

	export function parseIntSafe(value: any, radix: number = 10, defaultValue: number = 0): number {
		if (isNumber(value)) return Math.floor(value);
		const parsed = parseInt(value, radix);
		return isNumber(parsed) ? parsed : defaultValue;
	}

	export function removeTrailingZeros(str: string): string {
		const pattern = /^([^\0]*)[\0]*$/;
		const result = pattern.exec(str);
		return result ? result[1] : str;
	}

	export function bytesToAscii(input: number[]): string {
		return String.fromCharCode.apply(null, input);
	}

	export function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {

		if (!isUint8Array(a)) return b;
		if (!isUint8Array(b)) return a;

		const aLength = a.byteLength;
		const bLength = b.byteLength;
		const result = new Uint8Array(aLength + bLength);

		if (aLength > 0) result.set(a, 0);
		if (bLength > 0) result.set(b, aLength);

		return result;
	}
}