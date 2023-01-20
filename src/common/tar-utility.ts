export const SECTOR_SIZE = 512;
export const OCTAL_RADIX = 8;
export const USTAR_TAG = 'ustar';
export const USTAR_INDICATOR_VALUE = `${USTAR_TAG}\0`;
export const USTAR_VERSION_VALUE = '00';
export const HEADER_SIZE = SECTOR_SIZE;
export const FILE_MODE_DEFAULT = parseIntOctal('777');

export function noop<T>(value?: T): T {
	return value as any;
}

export function isNumber(value: any): boolean {
	return typeof value === 'number' && !Number.isNaN(value);
}

export function isString(value: any): boolean {
	return typeof value === 'string';
}

export function isPopulatedString(value: any): boolean {
	return isString(value) && value.length > 0;
}

export function isUint8Array(value: any): boolean {
	return !!(value && value instanceof Uint8Array);
}

export function sizeofUint8Array(value: any): number {
	return isUint8Array(value) ? value.byteLength : 0;
}

export function encodeString(input: string): Uint8Array {
	return isPopulatedString(input) ? new TextEncoder().encode(input) : new Uint8Array(0);
}

export function decodeString(input: Uint8Array): string {
	return isUint8Array(input) ? new TextDecoder().decode(input) : '';
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

export function decodeTimestamp(value: number): number {
	return Math.floor(parseIntSafe(value)) * 1000;
}

export function encodeTimestamp(value: number): number {
	return Math.floor(parseIntSafe(value) / 1000);
}

export function sanitizeTimestamp(value: number): number {
	return decodeTimestamp(encodeTimestamp(value));
}

export function parseIntOctal(input: string): number {
	return parseIntSafe(input, OCTAL_RADIX);
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

export function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {

	if (!isUint8Array(b)) return a;
	if (!isUint8Array(a)) return b;

	const aLength = a.byteLength;
	const bLength = b.byteLength;
	const result = new Uint8Array(aLength + bLength);

	if (aLength > 0) result.set(a, 0);
	if (bLength > 0) result.set(b, aLength);

	return result;
}