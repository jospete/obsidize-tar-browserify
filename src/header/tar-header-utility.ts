import { TarUtility } from '../tar-utility';
import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';
import { TarHeaderFieldDefinition } from './tar-header-field-definition';
import { TarHeaderFieldType } from './tar-header-field-type';
import { TarHeaderField } from './tar-header-field';
import { TarHeader } from './tar-header';

const {
	SECTOR_SIZE,
	advanceSectorOffset,
	removeTrailingZeros,
	parseIntSafe,
	isUint8Array,
	bytesToAscii,
	uint8ArrayToAscii,
	asciiToUint8Array,
	toString
} = TarUtility;

export interface TarHeaderFieldExtractionResult<T> {
	field: TarHeaderField;
	bytes: Uint8Array;
	value: T;
}

export type TarHeaderExtractionResult = {
	[key in keyof TarHeader]: TarHeaderFieldExtractionResult<any>;
};

/**
 * Common pure functions for serializing and deserializing tar header content.
 */
export namespace TarHeaderUtility {

	// ---------------- Common Utilities ----------------

	export function decodeLastModifiedTime(headerValue: number): number {
		return Math.floor(headerValue) * 1000;
	}

	export function encodeLastModifiedTime(timestamp: number): number {
		return Math.floor(timestamp / 1000);
	}

	export function sliceFieldAscii(field: TarHeaderField, input: Uint8Array, offset?: number): string {
		return bytesToAscii(Array.from(sliceFieldBuffer(field, input, offset)));
	}

	export function sliceFieldBuffer(field: TarHeaderField, input: Uint8Array, offset: number = 0): Uint8Array {
		const absoluteOffset = field.offset + offset;
		return input.slice(absoluteOffset, absoluteOffset + field.size);
	}

	export function isUstarSector(input: Uint8Array, offset?: number): boolean {
		const field = TarHeaderFieldDefinition.ustarIndicator();
		return sliceFieldAscii(field, input, offset) === field.constantValue;
	}

	export function normalizeHeaderValues(header: Partial<TarHeader>): TarHeader {

		const defaultValues: Partial<TarHeader> = {
			fileMode: '777',
			groupUserId: 0,
			ownerUserId: 0,
			fileSize: 0,
			lastModified: encodeLastModifiedTime(Date.now()),
			typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE,
			ustarIndicator: TarHeaderFieldDefinition.ustarIndicator().constantValue,
			ustarVersion: TarHeaderFieldDefinition.ustarVersion().constantValue,
			ownerUserName: '',
			ownerGroupName: '',
			padding: TarHeaderFieldDefinition.padding().constantValue
		};

		return Object.assign(defaultValues, header) as TarHeader;
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

	// ---------------- Extraction Utilities ----------------

	export function parseOctalIntSafe(value: string): number {
		return parseIntSafe(removeTrailingZeros(value).trim(), 8);
	}

	export function parseFieldValue(field: TarHeaderField, bufferValue: Uint8Array): any {

		let result = decodeFieldValue(field, uint8ArrayToAscii(bufferValue));

		if (field && field.name === TarHeaderFieldDefinition.lastModified().name) {
			result = decodeLastModifiedTime(result);
		}

		return result;
	}

	export function decodeFieldValue(field: TarHeaderField, value: string): any {

		if (!field) {
			return value;
		}

		switch (field.type) {
			case TarHeaderFieldType.INTEGER_OCTAL:
				return parseOctalIntSafe(value);
			case TarHeaderFieldType.ASCII_PADDED:
				return removeTrailingZeros(value);
			case TarHeaderFieldType.ASCII:
			default:
				return value;
		}
	}

	/**
	 * Extracts all known header fields from the given input buffer, at the given offset.
	 * 
	 * NOTE: this does not check if the buffer at the given offset is actually a ustar sector, and
	 * it is up to the caller to make this check.
	 */
	export function extractHeaderContent(input: Uint8Array, offset: number = 0): TarHeaderExtractionResult {

		const result: TarHeaderExtractionResult = {} as any;

		TarHeaderFieldDefinition.orderedSet().forEach(field => {
			const bytes = sliceFieldBuffer(field, input, offset);
			const value = parseFieldValue(field, bytes);
			result[field.name] = { field, bytes, value };
		});

		return result;
	}

	function copyHeaderValue(key: string, input: TarHeaderExtractionResult, output: TarHeader): void {
		const metadata: TarHeaderFieldExtractionResult<any> = (input as any)[key];
		const value = metadata ? metadata.value : undefined;
		if (value) (output as any)[key] = value;
	}

	export function flattenHeaderExtractionResult(input: TarHeaderExtractionResult): TarHeader {

		const result = {} as TarHeader;

		if (input) {
			Object.keys(input).forEach(key => {
				copyHeaderValue(key, input, result);
			});
		}

		return result;
	}

	// ---------------- Creation Utilities ----------------

	export function generateFieldChecksum(fieldValue: Uint8Array): number {
		return fieldValue ? fieldValue.reduce((a, b) => a + b, 0) : 0;
	}

	export function padIntegerOctal(value: number, maxLength: number): string {
		return parseIntSafe(value).toString(8).padStart(maxLength, '0');
	}

	export function serializeFieldValue(field: TarHeaderField, value: any): Uint8Array {
		return asciiToUint8Array(serializeFieldValueToString(field, value));
	}

	export function serializeFieldValueToString(field: TarHeaderField, value: any): string {

		if (field && field.type === TarHeaderFieldType.INTEGER_OCTAL) {
			// USTAR docs indicate that value length needs to be 1 less than actual field size
			return padIntegerOctal(value, field.size - 1);
		}

		return toString(value);
	}

	export function expandHeaderToExtractionResult(input: Partial<TarHeader>): TarHeaderExtractionResult {

		const normalizedHeader = normalizeHeaderValues(input);

		const result: TarHeaderExtractionResult = {} as any;

		TarHeaderFieldDefinition.orderedSet().forEach(field => {
			const { name } = field;
			const value = (normalizedHeader as any)[name];
			const bytes = serializeFieldValue(field, value);
			result[name] = { field, bytes, value };
		});

		return result;
	}

	/**
	 * Creates a USTAR sector buffer using the given header values.
	 * NOTE: missing fields will be auto-populated with the fields from normalizeHeaderValues()
	 */
	export function generateHeaderBuffer(header: Partial<TarHeader>): Uint8Array {

		const headerSize = SECTOR_SIZE;
		const headerBuffer = new Uint8Array(headerSize);
		const checksumField = TarHeaderFieldDefinition.headerChecksum();
		const normalizedHeader = normalizeHeaderValues(header);

		let checksum = 0;

		TarHeaderFieldDefinition.orderedSet().forEach(field => {

			const { name, offset } = field;

			if (name === checksumField.name) return;

			const valueBuffer = serializeFieldValue(field, normalizedHeader[name]);
			headerBuffer.set(valueBuffer, offset);

			checksum += generateFieldChecksum(valueBuffer);
		});

		headerBuffer.set(serializeFieldValue(checksumField, checksum), checksumField.offset);

		return headerBuffer;
	}
}