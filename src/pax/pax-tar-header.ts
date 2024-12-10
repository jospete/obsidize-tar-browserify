import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeaderField } from '../header/tar-header-field';
import { TarSerializable } from './../common/tar-utility';
import { PaxTarHeaderKey } from './pax-tar-header-key';
import { PaxTarHeaderSegment } from './pax-tar-header-segment';
import { PaxTarHeaderUtility } from './pax-tar-header-utility';

/**
 * Object of key-value pairs for raw PAX attributes to populate a `PaxTarHeader` instance with.
 */
export interface PaxTarHeaderAttributes extends Record<PaxTarHeaderKey | string, string> {
	comment: string;
	gid: string;
	gname: string;
	hdrcharset: string;
	linkpath: string;
	mtime: string;
	path: string;
	size: string;
	uid: string;
	uname: string;
}

/**
 * Adds support for extended headers.
 * https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_03
 */
export class PaxTarHeader implements TarSerializable {
	private readonly valueMap: Record<string, PaxTarHeaderSegment>;
	private mSectorByteLength: number | undefined;

	constructor(
		segments: PaxTarHeaderSegment[] = []
	) {
		this.valueMap = {};
		for (const segment of segments) {
			this.valueMap[segment.key] = segment;
		}
	}

	public static from(buffer: Uint8Array, offset: number = 0): PaxTarHeader {
		const segments = PaxTarHeader.parseSegments(buffer, offset);
		return new PaxTarHeader(segments);
	}

	public static fromAttributes(attributes: Partial<PaxTarHeaderAttributes>): PaxTarHeader {
		const segments = PaxTarHeader.parseSegmentsFromAttributes(attributes);
		return new PaxTarHeader(segments);
	}

	public static serializeAttributes(attributes: Partial<PaxTarHeaderAttributes>): Uint8Array {
		const segments = PaxTarHeader.parseSegmentsFromAttributes(attributes);
		return PaxTarHeader.serialize(segments);
	}

	public static parseSegmentsFromAttributes(attributes: Partial<PaxTarHeaderAttributes>): PaxTarHeaderSegment[] {
		if (!TarUtility.isObject(attributes)) {
			return [];
		}
		
		const segments: PaxTarHeaderSegment[] = [];
		
		for (const [key, value] of Object.entries(attributes)) {
			segments.push(new PaxTarHeaderSegment(key, value));
		}

		return segments;
	}

	public static serialize(segments: PaxTarHeaderSegment[]): Uint8Array {
		if (!Array.isArray(segments) || segments.length <= 0) {
			return new Uint8Array(0);
		}

		let totalLength = 0;
		let segmentBuffers: Uint8Array[] = [];

		for (const segment of segments) {
			const encodedSegment = segment.toUint8Array();
			segmentBuffers.push(encodedSegment);
			totalLength += encodedSegment.byteLength;
		}

		const resultBuffer = new Uint8Array(totalLength);
		let offset = 0;

		for (const segmentBuffer of segmentBuffers) {
			resultBuffer.set(segmentBuffer, offset);
			offset += segmentBuffer.byteLength;
		}

		return resultBuffer;
	}

	/**
	 * Wraps the given file name (if necessary) with the 'PaxHeader' metadata indicator.
	 * If the indicator already exists in the given file name, this does nothing.
	 */
	public static wrapFileName(fileName: string): string {
		if (!TarUtility.isString(fileName) || fileName.includes(Constants.PAX_HEADER_PREFIX)) {
			return fileName;
		}

		let sepIndex = fileName.lastIndexOf('/');

		if (sepIndex >= 0) {
			return PaxTarHeader.insertPaxAt(fileName, '/', sepIndex);
		}

		sepIndex = fileName.lastIndexOf('\\');

		if (sepIndex >= 0) {
			return PaxTarHeader.insertPaxAt(fileName, '\\', sepIndex);
		}

		return PaxTarHeader.makeTopLevelPrefix(fileName, '/', 0);
	}

	private static insertPaxAt(fileName: string, separator: string, offset: number): string {
		const maxLength = TarHeaderField.fileName.size;

		if (fileName.length < maxLength) {
			return fileName.substring(0, offset)
				+ separator + Constants.PAX_HEADER_PREFIX
				+ fileName.substring(offset);
		}

		return PaxTarHeader.makeTopLevelPrefix(fileName, '/', offset + 1);
	}

	private static makeTopLevelPrefix(fileName: string, separator: string, offset: number): string {
		const maxLength = TarHeaderField.fileName.size;

		// Dark magic observed from existing tar files
		let result = Constants.PAX_HEADER_PREFIX + separator + fileName.substring(offset);

		if (result.length > maxLength) {
			// Dark magic observed from existing tar files
			result = result.substring(0, maxLength - 2) + '\0\0';
		}

		return result;
	}

	private static parseSegments(buffer: Uint8Array, offset: number): PaxTarHeaderSegment[] {
		const result: PaxTarHeaderSegment[] = [];
		let cursor = offset;
		let next = PaxTarHeaderSegment.tryParse(buffer, cursor);

		while (next !== null) {
			result.push(next);
			cursor += next.bytes.byteLength;
			next = PaxTarHeaderSegment.tryParse(buffer, cursor);
		}

		return result;
	}

	/**
	 * See `PaxTarHeaderKey.ACCESS_TIME` for more info
	 */
	public get accessTime(): number | undefined {
		return this.getFloat(PaxTarHeaderKey.ACCESS_TIME);
	}

	/**
	 * See `PaxTarHeaderKey.CHARSET` for more info
	 */
	public get charset(): string | undefined {
		return this.get(PaxTarHeaderKey.CHARSET);
	}

	/**
	 * See `PaxTarHeaderKey.COMMENT` for more info
	 */
	public get comment(): string | undefined {
		return this.get(PaxTarHeaderKey.COMMENT);
	}

	/**
	 * See `PaxTarHeaderKey.GROUP_ID` for more info
	 */
	public get groupId(): number | undefined {
		return this.getInt(PaxTarHeaderKey.GROUP_ID);
	}

	/**
	 * See `PaxTarHeaderKey.GROUP_NAME` for more info
	 */
	public get groupName(): string | undefined {
		return this.get(PaxTarHeaderKey.GROUP_NAME);
	}

	/**
	 * See `PaxTarHeaderKey.HDR_CHARSET` for more info
	 */
	public get hdrCharset(): string | undefined {
		return this.get(PaxTarHeaderKey.HDR_CHARSET);
	}

	/**
	 * See `PaxTarHeaderKey.LINK_PATH` for more info
	 */
	public get linkPath(): string | undefined {
		return this.get(PaxTarHeaderKey.LINK_PATH);
	}

	/**
	 * See `PaxTarHeaderKey.MODIFICATION_TIME` for more info
	 */
	public get modificationTime(): number | undefined {
		return this.getFloat(PaxTarHeaderKey.MODIFICATION_TIME);
	}

	/**
	 * See `PaxTarHeaderKey.PATH` for more info
	 */
	public get path(): string | undefined {
		return this.get(PaxTarHeaderKey.PATH);
	}

	/**
	 * See `PaxTarHeaderKey.SIZE` for more info
	 */
	public get size(): number | undefined {
		return this.getInt(PaxTarHeaderKey.SIZE);
	}

	/**
	 * See `PaxTarHeaderKey.USER_ID` for more info
	 */
	public get userId(): number | undefined {
		return this.getInt(PaxTarHeaderKey.USER_ID);
	}

	/**
	 * See `PaxTarHeaderKey.USER_NAME` for more info
	 */
	public get userName(): string | undefined {
		return this.get(PaxTarHeaderKey.USER_NAME);
	}

	/**
	 * Converts modificationTime to standard javascript epoch time.
	 */
	public get lastModified(): number | undefined {
		const mtime = this.modificationTime;
		return mtime ? TarUtility.paxTimeToDate(mtime!) : undefined;
	}

	/**
	 * @returns an array of the keys in this header
	 */
	public keys(): string[] {
		return Object.keys(this.valueMap);
	}

	/**
	 * @returns an array of the key/value pair entries in this header
	 */
	public entries(): [string, PaxTarHeaderSegment][] {
		return Object.entries(this.valueMap);
	}

	/**
	 * Removes any unknown or un-standardized keys from this header.
	 * @returns `this` for operation chaining
	 */
	public clean(): this {
		for (const key of Object.keys(this.valueMap)) {
			if (!PaxTarHeaderUtility.isKnownHeaderKey(key)) {
				delete this.valueMap[key];
			}
		}

		return this;
	}

	/**
	 * @returns The total byte-length of this header in serialized form.
	 */
	public calculateSectorByteLength(): number {
		if (TarUtility.isNumber(this.mSectorByteLength)) {
			return this.mSectorByteLength;
		}

		const bytes = this.toUint8Array();
		this.mSectorByteLength = TarUtility.roundUpSectorOffset(bytes.byteLength);
		
		return this.mSectorByteLength;
	}

	/**
	 * @returns true if the value map of this parsed header contains the given key
	 */
	public has(key: PaxTarHeaderKey | string): boolean {
		return TarUtility.isDefined(this.valueMap[key]);
	}

	/**
	 * @returns the value parsed from the bytes of this header for the given key,
	 * or `undefined` if the key did not exist in the header.
	 */
	public get(key: PaxTarHeaderKey | string): string | undefined {
		return this.valueMap[key]?.value;
	}

	/**
	 * Parse the value for the given key as an int.
	 * @returns undefined if the key does not exist or the parse operation fails.
	 */
	public getInt(key: PaxTarHeaderKey | string): number | undefined {
		return this.valueMap[key]?.intValue;
	}

	/**
	 * Parse the value for the given key as a float.
	 * @returns undefined if the key does not exist or the parse operation fails.
	 */
	public getFloat(key: PaxTarHeaderKey | string): number | undefined {
		return this.valueMap[key]?.floatValue;
	}

	/**
	 * Serializes the underlying value map of this instance into a set of PAX sectors.
	 */
	public toUint8Array(): Uint8Array {
		return PaxTarHeader.serialize(Object.values(this.valueMap));
	}

	/**
	 * Adds any necessary padding to the serialized output to ensure the length
	 * of the output is a multiple of `SECTOR_SIZE`.
	 * 
	 * See `toUint8Array()` for more info.
	 */
	public toUint8ArrayPadded(): Uint8Array {
		const serializedBuffer = this.toUint8Array();
		let delta = TarUtility.getSectorOffsetDelta(serializedBuffer.byteLength);

		if (delta > 0) {
			return TarUtility.concatUint8Arrays(serializedBuffer, new Uint8Array(delta));
		}

		return serializedBuffer;
	}

	public toJSON(): Record<string, unknown> {
		const {valueMap} = this;
		const bytes = this.toUint8Array();
		const byteLength = bytes.byteLength;
		const content = TarUtility.getDebugHexString(bytes);

		return {
			valueMap,
			byteLength,
			content
		};
	}
}
