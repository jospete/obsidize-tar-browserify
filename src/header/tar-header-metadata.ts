import { encodeString, generateChecksum, HEADER_SIZE, isUint8Array } from '../common';
import { getDefaultHeaderValues, sanitizeHeader, TarHeader } from './tar-header';
import { checksumSet, headerChecksum, orderedSet, TarHeaderField } from './tar-header-field';
import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';

export interface TarHeaderFieldMetadata<T> {
	field: TarHeaderField;
	bytes: Uint8Array;
	value: T;
}

export type TarHeaderMetadataLike = {
	[key in keyof TarHeader]: TarHeaderFieldMetadata<any>;
};

const CHECKSUM_SEED_STRING = ''.padStart(headerChecksum.size, ' ');
const CHECKSUM_SEED = generateChecksum(encodeString(CHECKSUM_SEED_STRING));

export class TarHeaderMetadata implements TarHeaderMetadataLike {

	fileName: TarHeaderFieldMetadata<string>;
	fileMode: TarHeaderFieldMetadata<number>;
	ownerUserId: TarHeaderFieldMetadata<number>;
	groupUserId: TarHeaderFieldMetadata<number>;
	fileSize: TarHeaderFieldMetadata<number>;
	lastModified: TarHeaderFieldMetadata<number>;
	headerChecksum: TarHeaderFieldMetadata<number>;
	linkedFileName: TarHeaderFieldMetadata<string>;
	typeFlag: TarHeaderFieldMetadata<TarHeaderLinkIndicatorType>;
	ustarIndicator: TarHeaderFieldMetadata<string>;
	ustarVersion: TarHeaderFieldMetadata<string>;
	ownerUserName: TarHeaderFieldMetadata<string>;
	ownerGroupName: TarHeaderFieldMetadata<string>;
	deviceMajorNumber: TarHeaderFieldMetadata<string>;
	deviceMinorNumber: TarHeaderFieldMetadata<string>;
	fileNamePrefix: TarHeaderFieldMetadata<string>;

	constructor(input: Partial<TarHeader> | null = getDefaultHeaderValues()) {
		this.expandFrom(input);
	}

	public static serialize(input: Partial<TarHeader> | null): Uint8Array {
		return new TarHeaderMetadata(input).toUint8Array();
	}

	public static flattenFrom(input: Uint8Array, offset?: number): TarHeader {
		return TarHeaderMetadata.from(input, offset).flatten();
	}

	/**
	 * Extracts all known header fields from the given input buffer, at the given offset.
	 * 
	 * NOTE: this does not check if the buffer at the given offset is actually a ustar sector, and
	 * it is up to the caller to make this check.
	 */
	public static from(input: Uint8Array, offset?: number): TarHeaderMetadata {

		const result = new TarHeaderMetadata();

		if (isUint8Array(input)) {
			orderedSet().forEach(field => {
				result.setSerializedField(field, input, offset);
			});
		}

		return result;
	}

	protected setDeserializedFieldFrom<T = any>(
		field: TarHeaderField,
		header: TarHeader
	): TarHeaderFieldMetadata<T> {
		return this.setDeserializedField<T>(field, (header as any)[field.name]);
	}

	protected setDeserializedField<T = any>(
		field: TarHeaderField,
		value: T
	): TarHeaderFieldMetadata<T> {
		const bytes = field.serialize(value);
		const result = (this as any)[field.name] = { field, bytes, value };
		return result;
	}

	protected setSerializedField<T = any>(
		field: TarHeaderField,
		input: Uint8Array,
		offset: number = 0
	): TarHeaderFieldMetadata<T> {
		const bytes = field.slice(input, offset);
		const value = field.deserialize<T>(bytes)!;
		const result = (this as any)[field.name] = { field, bytes, value };
		return result;
	}

	public expandFrom(input: Partial<TarHeader> | null): TarHeaderMetadata {

		const normalizedHeader = sanitizeHeader(input);

		let checksum = CHECKSUM_SEED;

		for (const field of checksumSet()) {
			const { bytes } = this.setDeserializedFieldFrom(field, normalizedHeader);
			checksum += generateChecksum(bytes);
		}

		this.setDeserializedField(headerChecksum, checksum);

		return this;
	}

	public flatten(): TarHeader {

		const result = {} as TarHeader;

		for (const field of orderedSet()) {
			(result as any)[field.name] = this[field.name].value;
		}

		return sanitizeHeader(result);
	}

	/**
	 * Creates a USTAR sector buffer using the currently set header values.
	 * NOTE: missing fields will be auto-populated with default values.
	 */
	public toUint8Array(): Uint8Array {

		const headerBuffer = new Uint8Array(HEADER_SIZE);

		for (const field of orderedSet()) {
			const { bytes } = this[field.name];
			headerBuffer.set(bytes, field.offset);
		}

		return headerBuffer;
	}
}