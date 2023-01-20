import {
	encodeString,
	FILE_MODE_DEFAULT,
	generateChecksum,
	HEADER_SIZE,
	isNumber,
	isUint8Array,
	USTAR_INDICATOR_VALUE,
	USTAR_VERSION_VALUE
} from '../common';

import {
	sanitizeTimestamp,
	TarHeaderField
} from './tar-header-field';

import {
	checksumSet,
	headerChecksum,
	orderedSet
} from './tar-header-field-definitions';

import { TarHeader } from './tar-header';
import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';

const CHECKSUM_SEED_STRING = ''.padStart(headerChecksum.size, ' ');
const CHECKSUM_SEED = generateChecksum(encodeString(CHECKSUM_SEED_STRING));
const ALL_FIELDS = orderedSet();
const CHECKSUM_FIELDS = checksumSet();

export interface TarHeaderFieldMetadata<T> {
	field: TarHeaderField;
	bytes: Uint8Array;
	value: T;
}

export type TarHeaderMetadataLike = {
	[key in keyof TarHeader]: TarHeaderFieldMetadata<any>;
};

export function sanitizeHeader(header: Partial<TarHeader> | null): TarHeader {

	if (header && isNumber(header.lastModified)) {
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
		ustarIndicator: USTAR_INDICATOR_VALUE,
		ustarVersion: USTAR_VERSION_VALUE,
		ownerUserName: '',
		ownerGroupName: '',
		deviceMajorNumber: '00',
		deviceMinorNumber: '00',
		fileNamePrefix: ''
	};
}

/**
 * Expanded version of a TarHeader that contains both the
 * serialized and deserialized state of each field.
 */
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
		this.inflate(input);
	}

	/**
	 * Shorthand for populating a new instance and immediately 
	 * collapsing it with `toUint8Array()`.
	 */
	public static serialize(input: Partial<TarHeader> | null): Uint8Array {
		return new TarHeaderMetadata(input).toUint8Array();
	}

	/**
	 * Shorthand for populating a new instance and immediately
	 * collapsing it with `deflate()`.
	 */
	public static deflateFrom(input: Uint8Array, offset?: number): TarHeader {
		return TarHeaderMetadata.from(input, offset).deflate();
	}

	/**
	 * Extracts all known header fields from the given input buffer, at the given offset.
	 * 
	 * NOTE: this does not check if the buffer at the given offset is actually a ustar sector, and
	 * it is up to the caller to make this check.
	 */
	public static from(input: Uint8Array, offset?: number): TarHeaderMetadata {

		const result = new TarHeaderMetadata();

		if (isUint8Array(input))
			for (const field of ALL_FIELDS)
				result.setSerializedField(field, input, offset);

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

	/**
	 * Same as `inflate()`, but seeds the input with the values currently
	 * set on this instance as defaults.
	 */
	public update(input: Partial<TarHeader>): this {
		const snapshot = Object.assign(this.deflate(), input);
		return this.inflate(snapshot);
	}

	/**
	 * Overwrite this instance's fields with the given header values.
	 */
	public inflate(input: Partial<TarHeader> | null): this {

		const normalizedHeader = sanitizeHeader(input);

		let checksum = CHECKSUM_SEED;

		for (const field of CHECKSUM_FIELDS) {
			const { bytes } = this.setDeserializedFieldFrom(field, normalizedHeader);
			checksum += generateChecksum(bytes);
		}

		this.setDeserializedField(headerChecksum, checksum);

		return this;
	}

	/**
	 * Generate a TarHeader snapshot from this instance's current state.
	 */
	public deflate(): TarHeader {

		const result = {} as TarHeader;

		for (const field of ALL_FIELDS) {
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

		for (const field of ALL_FIELDS) {
			const { bytes } = this[field.name];
			headerBuffer.set(bytes, field.offset);
		}

		return headerBuffer;
	}
}