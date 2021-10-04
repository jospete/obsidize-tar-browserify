import { TarUtility } from '../tar-utility';
import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';
import { TarHeaderFieldDefinition } from './tar-header-field-definition';
import { TarHeaderFieldType } from './tar-header-field-type';
import { TarHeaderField } from './tar-header-field';
import { TarHeader } from './tar-header';

export interface TarHeaderFieldExtractionResult<T> {
	field: TarHeaderField;
	bytes: Uint8Array;
	value: T;
}

export type TarHeaderExtractionResult = {
	[key in keyof TarHeader]: TarHeaderFieldExtractionResult<any>;
};

interface FieldTransform<T> {
	serialize(input: T, field: TarHeaderField): Uint8Array;
	deserialize(input: Uint8Array, field: TarHeaderField): T;
}

/**
 * Common pure functions for serializing and deserializing tar header content.
 */
export namespace TarHeaderUtility {

	export const OCTAL_RADIX = 8;
	export const HEADER_SIZE = TarUtility.SECTOR_SIZE;
	export const FILE_MODE_DEFAULT = parseIntOctal('777');

	const fieldTypeTransformMap: { [key: string]: FieldTransform<any> } = {
		[TarHeaderFieldType.ASCII]: {
			serialize: TarUtility.encodeString,
			deserialize: TarUtility.decodeString
		},
		[TarHeaderFieldType.ASCII_PADDED_END]: {
			serialize: TarUtility.encodeString,
			deserialize: deserializeAsciiPaddedField
		},
		[TarHeaderFieldType.INTEGER_OCTAL]: {
			serialize: serializeIntegerOctal,
			deserialize: deserializeIntegerOctal
		},
		[TarHeaderFieldType.INTEGER_OCTAL_TIMESTAMP]: {
			serialize: serializeIntegerOctalTimestamp,
			deserialize: deserializeIntegerOctalTimestamp
		}
	};

	// ---------------- Common Utilities ----------------

	export function decodeTimestamp(headerValue: number): number {
		return Math.floor(TarUtility.parseIntSafe(headerValue)) * 1000;
	}

	export function encodeTimestamp(timestamp: number): number {
		return Math.floor(TarUtility.parseIntSafe(timestamp) / 1000);
	}

	export function sanitizeTimestamp(timestamp: number): number {
		return decodeTimestamp(encodeTimestamp(timestamp));
	}

	export function deserializeAsciiPaddedField(value: Uint8Array): string {
		return TarUtility.removeTrailingZeros(TarUtility.decodeString(value));
	}

	export function parseIntOctal(input: string): number {
		return TarUtility.parseIntSafe(input, OCTAL_RADIX);
	}

	export function deserializeIntegerOctal(input: Uint8Array): number {
		return TarUtility.parseIntSafe(TarUtility.decodeString(input), OCTAL_RADIX);
	}

	export function serializeIntegerOctal(value: number, field: TarHeaderField): Uint8Array {
		const { size } = (field || {});
		// USTAR docs indicate that value length needs to be 1 less than actual field size
		return TarUtility.encodeString(serializeIntegerOctalToString(value, size - 1));
	}

	export function serializeIntegerOctalToString(value: number, maxLength: number): string {
		return TarUtility.parseIntSafe(value)
			.toString(OCTAL_RADIX)
			.padStart(maxLength, '0');
	}

	export function serializeIntegerOctalTimestamp(value: number, field: TarHeaderField): Uint8Array {
		return serializeIntegerOctal(encodeTimestamp(value), field);
	}

	export function deserializeIntegerOctalTimestamp(value: Uint8Array): number {
		return decodeTimestamp(deserializeIntegerOctal(value));
	}

	export function sliceFieldAscii(field: TarHeaderField, input: Uint8Array, offset?: number): string {
		return TarUtility.bytesToAscii(Array.from(sliceFieldBuffer(field, input, offset)));
	}

	export function sliceFieldBuffer(field: TarHeaderField, input: Uint8Array, offset: number = 0): Uint8Array {
		if (!field || !TarUtility.isUint8Array(input)) return new Uint8Array(0);
		const absoluteOffset = field.offset + offset;
		return input.slice(absoluteOffset, absoluteOffset + field.size);
	}

	export function isUstarSector(input: Uint8Array, offset?: number): boolean {
		const field = TarHeaderFieldDefinition.ustarIndicator();
		return sliceFieldAscii(field, input, offset) === field.constantValue;
	}

	export function sanitizeHeader(header: Partial<TarHeader> | null): TarHeader {

		if (header && TarUtility.isNumber(header.lastModified)) {
			header.lastModified = sanitizeTimestamp(header.lastModified!);
		}

		return Object.assign(getDefaultHeaderValues(), (header || {})) as TarHeader;
	}

	export function getDefaultHeaderValues(): TarHeader {
		return {
			fileName: '',
			fileMode: FILE_MODE_DEFAULT,
			groupUserId: 0,
			ownerUserId: 0,
			fileSize: 0,
			lastModified: sanitizeTimestamp(Date.now()),
			headerChecksum: 0,
			linkedFileName: '',
			typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE,
			ustarIndicator: TarHeaderFieldDefinition.ustarIndicator().constantValue,
			ustarVersion: TarHeaderFieldDefinition.ustarVersion().constantValue,
			ownerUserName: '',
			ownerGroupName: '',
			deviceMajorNumber: '00',
			deviceMinorNumber: '00',
			fileNamePrefix: '',
			padding: TarHeaderFieldDefinition.padding().constantValue
		};
	}

	/**
	 * Searches the given input buffer for a USTAR header tar sector, starting at the given offset.
	 * Returns -1 if no valid header sector is found.
	 */
	export function findNextUstarSectorOffset(input: Uint8Array, offset: number = 0): number {

		const NOT_FOUND = -1;

		if (!TarUtility.isUint8Array(input)) {
			return NOT_FOUND;
		}

		const maxOffset = input.byteLength;
		let nextOffset = Math.max(0, offset);

		while (nextOffset < maxOffset && !isUstarSector(input, nextOffset)) {
			nextOffset = TarUtility.advanceSectorOffset(nextOffset, maxOffset);
		}

		if (nextOffset < maxOffset) {
			return nextOffset;
		}

		return NOT_FOUND;
	}

	// ---------------- Extraction Utilities ----------------

	export function extractHeader(input: Uint8Array, offset?: number): TarHeader {
		return flattenHeaderExtractionResult(extractHeaderContent(input, offset));
	}

	export function deserializeFieldValue(field: TarHeaderField, input: Uint8Array): any {
		const { type } = (field || {});
		const transform: FieldTransform<any> = fieldTypeTransformMap[type];
		return transform && TarUtility.isUint8Array(input)
			? transform.deserialize(input, field)
			: undefined;
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
			const value = deserializeFieldValue(field, bytes);
			result[field.name] = { field, bytes, value };
		});

		return result;
	}

	export function flattenHeaderExtractionResult(input: TarHeaderExtractionResult): TarHeader {

		const result = {} as TarHeader;

		if (input) {
			Object.keys(input).forEach(key => {
				const metadata: TarHeaderFieldExtractionResult<any> = (input as any)[key];
				const value = metadata ? metadata.value : undefined;
				if (TarUtility.isDefined(value)) (result as any)[key] = value;
			});
		}

		return sanitizeHeader(result);
	}

	// ---------------- Creation Utilities ----------------

	export function generateFieldChecksum(fieldValue: Uint8Array): number {
		return TarUtility.isUint8Array(fieldValue) ? fieldValue.reduce((a, b) => a + b, 0) : 0;
	}

	export function expandHeaderFieldToExtractionResult<T>(field: TarHeaderField, value: T): TarHeaderFieldExtractionResult<T> {
		const bytes = serializeFieldValue(field, value);
		return { field, bytes, value };
	}

	export function serializeFieldValue(field: TarHeaderField, input: any): Uint8Array {

		const { type, size } = (field || {});
		const transform: FieldTransform<any> = fieldTypeTransformMap[type];
		const result = new Uint8Array(size);

		if (transform && TarUtility.isDefined(input)) {
			result.set(transform.serialize(input, field), 0);
		}

		return result;
	}

	/**
	 * Creates a USTAR sector buffer using the given header values.
	 * NOTE: missing fields will be auto-populated with the defaults via sanitizeHeader()
	 */
	export function generateHeaderBuffer(header: Partial<TarHeader> | null): Uint8Array {

		const headerBuffer = new Uint8Array(HEADER_SIZE);
		const extracted = expandHeaderToExtractionResult(header);

		for (const metadata of Object.values(extracted)) {
			headerBuffer.set(metadata.bytes, metadata.field.offset);
		}

		return headerBuffer;
	}

	export function expandHeaderToExtractionResult(input: Partial<TarHeader> | null): TarHeaderExtractionResult {

		const result: TarHeaderExtractionResult = {} as any;
		const checksumField = TarHeaderFieldDefinition.headerChecksum();
		const normalizedHeader = sanitizeHeader(input);

		let checksum = 0;

		TarHeaderFieldDefinition.orderedSet().forEach(field => {

			const { name } = field;
			if (name === checksumField.name) return;

			const value = (normalizedHeader as any)[name];
			const bytes = serializeFieldValue(field, value);
			result[name] = { field, bytes, value };

			checksum += generateFieldChecksum(bytes);
		});

		const checksumBytes = serializeFieldValue(checksumField, checksum);

		result[checksumField.name] = {
			field: checksumField,
			bytes: checksumBytes,
			value: checksum
		};

		return result;
	}
}