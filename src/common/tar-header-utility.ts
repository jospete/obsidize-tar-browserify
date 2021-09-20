import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';
import { TarHeaderFieldDefinition } from './tar-header-field-definition';
import { TarHeaderExtractionResult } from './tar-header-extraction-result';
import { TarHeaderFieldType } from './tar-header-field-type';
import { TarHeaderField } from './tar-header-field';
import { TarHeader } from './tar-header';
import { TarUtility } from './tar-utility';

const {
	SECTOR_SIZE,
	advanceSectorOffset,
	removeTrailingZeros,
	parseIntSafe,
	isUint8Array,
	bytesToAscii,
	createFixedSizeUint8Array,
	asciiToBytes
} = TarUtility;

const {
	ustarIndicator,
	headerChecksum
} = TarHeaderFieldDefinition;

/**
 * Common pure functions for serializing and deserializing tar header content.
 */
export namespace TarHeaderUtility {

	export const USTAR_INDICATOR_VALUE = 'ustar\0';
	export const USTAR_VERSION_VALUE = '00';

	export function parseOctalIntSafe(value: string): number {
		return parseIntSafe(removeTrailingZeros(value).trim(), 8);
	}

	export function sliceFieldBuffer(field: TarHeaderField, input: Uint8Array, offset: number = 0): Uint8Array {
		const absoluteOffset = field.offset + offset;
		return input.slice(absoluteOffset, absoluteOffset + field.size);
	}

	export function sliceFieldAscii(field: TarHeaderField, input: Uint8Array, offset?: number): string {
		return bytesToAscii(Array.from(sliceFieldBuffer(field, input, offset)));
	}

	export function isUstarSector(input: Uint8Array, offset?: number): boolean {
		return sliceFieldAscii(ustarIndicator(), input, offset) === USTAR_INDICATOR_VALUE;
	}

	export function decodeLastModifiedTime(headerValue: number): number {
		return Math.floor(headerValue) * 1000;
	}

	export function encodeLastModifiedTime(timestamp: number): number {
		return Math.floor(timestamp / 1000);
	}

	export function generateFieldChecksum(fieldValue: Uint8Array): number {
		return fieldValue.reduce((a, b) => a + b, 0);
	}

	export function unparseAsciiFixed(input: string, byteCount: number): Uint8Array {
		return createFixedSizeUint8Array(asciiToBytes(input), byteCount);
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

	export function sanitizeHeaderValues(header: TarHeader): TarHeader {

		const defaultValues: Partial<TarHeader> = {
			fileMode: '777',
			groupUserId: 0,
			ownerUserId: 0,
			fileSize: 0,
			lastModified: encodeLastModifiedTime(Date.now()),
			headerChecksum: ''.padEnd(headerChecksum().size, ' '),
			typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE,
			ustarIndicator: USTAR_INDICATOR_VALUE,
			ustarVersion: USTAR_VERSION_VALUE,
			ownerUserName: '',
			ownerGroupName: ''
		};

		return Object.assign(defaultValues, header);
	}

	/**
	 * Searches the given input buffer for a USTAR header tar sector, starting at the given offset.
	 * Returns -1 if no valid header sector is found.
	 */
	export function findNextUstarSectorOffset(input: Uint8Array, offset: number = 0): number {

		if (!isUint8Array(input)) {
			return -1;
		}

		const maxOffset = input.byteLength;
		let nextOffset = Math.max(0, offset);

		while (nextOffset < maxOffset && !isUstarSector(input, nextOffset)) {
			nextOffset = advanceSectorOffset(nextOffset, maxOffset);
		}

		if (nextOffset >= maxOffset) {
			return -1;
		}

		return nextOffset;
	}

	export function decodeFieldValue(field: TarHeaderField, value: string): any {
		const { type } = field;
		switch (type) {
			case TarHeaderFieldType.INTEGER_OCTAL:
				return parseOctalIntSafe(value);
			case TarHeaderFieldType.ASCII_PADDED:
				return removeTrailingZeros(value);
			case TarHeaderFieldType.ASCII:
			default:
				return value;
		}
	}

	export function extractHeader(input: Uint8Array, offset: number = 0): TarHeaderExtractionResult {

		const result: TarHeaderExtractionResult = {} as any;

		TarHeaderFieldDefinition.orderedSet().forEach(field => {
			const bytes = sliceFieldBuffer(field, input, offset);
			const value = decodeFieldValue(field, bytesToAscii(Array.from(bytes)));
			result[field.name] = { field, bytes, value };
		});

		return result;
	}

	export function encodeFieldValue(field: TarHeaderField, input: any): Uint8Array {
		const { type, size } = field;
		switch (type) {
			case TarHeaderFieldType.INTEGER_OCTAL:
				return unparseIntegerOctalField(input, size);
			case TarHeaderFieldType.ASCII_PADDED:
			case TarHeaderFieldType.ASCII:
			default:
				return unparseAsciiFixed(input, size);
		}
	}

	/**
	 * Encodes the fields of the given header into a header sector.
	 */
	export function generateHeaderSector(header: TarHeader): Uint8Array {

		const resultSize = SECTOR_SIZE;
		const result = new Uint8Array(resultSize);
		const fields = TarHeaderFieldDefinition.orderedSet();
		const safeHeader = sanitizeHeaderValues(header);

		let maxContentOffset = 0;

		for (const field of fields) {

			const { name, offset, size } = field;
			const fieldMaxOffset = offset + size;

			if (fieldMaxOffset > resultSize) continue;

			const valueBytes = encodeFieldValue(field, safeHeader[name]);
			result.set(valueBytes, offset);
			maxContentOffset = Math.max(maxContentOffset, fieldMaxOffset);
		}

		return result;
	}
}