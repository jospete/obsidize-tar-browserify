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
	toString
} = TarUtility;

const {
	ustarIndicator,
	ustarVersion,
	headerChecksum
} = TarHeaderFieldDefinition;

/**
 * Common pure functions for serializing and deserializing tar header content.
 */
export namespace TarHeaderUtility {

	// ---------------- Tar Header Common ----------------

	export function decodeLastModifiedTime(headerValue: number): number {
		return Math.floor(headerValue) * 1000;
	}

	export function encodeLastModifiedTime(timestamp: number): number {
		return Math.floor(timestamp / 1000);
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
			ustarIndicator: ustarIndicator().constantValue,
			ustarVersion: ustarVersion().constantValue,
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

	// ---------------- Tar Header Extraction ----------------

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
		const field = ustarIndicator();
		return sliceFieldAscii(field, input, offset) === field.constantValue;
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

	// ---------------- Tar Header Creation ----------------

	function generateFieldChecksum(fieldValue: Uint8Array): number {
		return fieldValue.reduce((a, b) => a + b, 0);
	}

	function serializeFieldValue(field: TarHeaderField, value: any): Uint8Array {
		return stringToUint8(serializeFieldValueToString(field, value));
	}

	function padIntegerOctal(value: number, maxLength: number): string {
		return parseIntSafe(value).toString(8).padStart(maxLength, '0');
	}

	function stringToUint8(str: string): Uint8Array {

		str = toString(str);
		const result = new Uint8Array(str.length);

		for (let i = 0; i < str.length; i++) {
			result[i] = str.charCodeAt(i);
		}

		return result;
	}

	function serializeFieldValueToString(field: TarHeaderField, value: any): string {

		const { constantValue, size } = field;

		if (constantValue && !value) {
			return toString(constantValue);
		}

		if (field.type === TarHeaderFieldType.INTEGER_OCTAL) {
			// USTAR docs indicate that value length needs to be 1 less than actual field size
			return padIntegerOctal(value, size - 1);
		}

		return toString(value);
	}

	export function generateHeaderBuffer(file: any): Uint8Array {

		const headerSize = SECTOR_SIZE;
		const headerBuffer = new Uint8Array(headerSize);
		const checksumField = TarHeaderFieldDefinition.headerChecksum();

		let checksum = 0;

		TarHeaderFieldDefinition.orderedSet().forEach(field => {

			const { name, offset } = field;

			if (name === checksumField.name || !(name in file)) return;

			const valueBuffer = serializeFieldValue(field, file[name]);
			headerBuffer.set(valueBuffer, offset);
			checksum += generateFieldChecksum(valueBuffer);
		});

		headerBuffer.set(serializeFieldValue(checksumField, checksum), checksumField.offset);

		return headerBuffer;
	}
}