import { Constants } from '../../common/constants.ts';
import { TarSerializable, TarUtility } from '../../common/tar-utility.ts';
import { UstarHeaderField } from '../ustar/ustar-header-field.ts';
import { PaxHeaderKey } from './pax-header-key.ts';
import { PaxHeaderSegment } from './pax-header-segment.ts';
import { PaxHeaderUtility } from './pax-header-utility.ts';

/**
 * Object of key-value pairs for raw PAX attributes to populate a `PaxHeader` instance with.
 */
export interface PaxHeaderAttributes extends Record<PaxHeaderKey | string, string | number> {
	comment: string;
	gid: number | string;
	gname: string;
	hdrcharset: string;
	linkpath: string;
	mtime: number | string;
	path: string;
	size: number | string;
	uid: number | string;
	uname: string;
}

/**
 * Adds support for extended headers.
 * https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_03
 */
export class PaxHeader implements TarSerializable {
	private readonly valueMap: Record<string, PaxHeaderSegment>;

	constructor(segments: PaxHeaderSegment[] = []) {
		this.valueMap = {};
		for (const segment of segments) {
			this.valueMap[segment.key] = segment;
		}
	}

	public static deserialize(buffer: Uint8Array, offset: number = 0): PaxHeader {
		const segments = PaxHeader.deserializeSegments(buffer, offset);
		return new PaxHeader(segments);
	}

	public static fromAttributes(attributes: Partial<PaxHeaderAttributes>): PaxHeader {
		const segments = PaxHeader.parseSegmentsFromAttributes(attributes);
		return new PaxHeader(segments);
	}

	public static serializeAttributes(attributes: Partial<PaxHeaderAttributes>): Uint8Array {
		const segments = PaxHeader.parseSegmentsFromAttributes(attributes);
		return PaxHeader.serializeSegments(segments);
	}

	public static parseSegmentsFromAttributes(attributes: Partial<PaxHeaderAttributes>): PaxHeaderSegment[] {
		if (!TarUtility.isObject(attributes)) {
			return [];
		}

		const segments: PaxHeaderSegment[] = [];

		for (const [key, value] of Object.entries(attributes)) {
			const strVal = TarUtility.isString(value) ? value : String(value);
			segments.push(new PaxHeaderSegment(key, strVal));
		}

		return segments;
	}

	public static serializeSegments(segments: PaxHeaderSegment[]): Uint8Array {
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
			return PaxHeader.insertPaxAt(fileName, '/', sepIndex);
		}

		sepIndex = fileName.lastIndexOf('\\');

		if (sepIndex >= 0) {
			return PaxHeader.insertPaxAt(fileName, '\\', sepIndex);
		}

		return PaxHeader.makeTopLevelPrefix(fileName, '/', 0);
	}

	private static insertPaxAt(fileName: string, separator: string, offset: number): string {
		const maxLength = UstarHeaderField.fileName.size;

		if (fileName.length < maxLength) {
			return fileName.substring(0, offset) + separator + Constants.PAX_HEADER_PREFIX + fileName.substring(offset);
		}

		return PaxHeader.makeTopLevelPrefix(fileName, '/', offset + 1);
	}

	private static makeTopLevelPrefix(fileName: string, separator: string, offset: number): string {
		const maxLength = UstarHeaderField.fileName.size;

		// Dark magic observed from existing tar files
		let result = Constants.PAX_HEADER_PREFIX + separator + fileName.substring(offset);

		if (result.length > maxLength) {
			// Dark magic observed from existing tar files
			result = result.substring(0, maxLength - 2) + '\0\0';
		}

		return result;
	}

	private static deserializeSegments(buffer: Uint8Array, offset: number): PaxHeaderSegment[] {
		const result: PaxHeaderSegment[] = [];
		let cursor = offset;
		let next = PaxHeaderSegment.deserialize(buffer, cursor);

		while (next !== null) {
			result.push(next);
			cursor += next.bytes.byteLength;
			next = PaxHeaderSegment.deserialize(buffer, cursor);
		}

		return result;
	}

	/**
	 * See `PaxHeaderKey.ACCESS_TIME` for more info
	 */
	public get accessTime(): number | undefined {
		return this.getFloat(PaxHeaderKey.ACCESS_TIME);
	}

	/**
	 * See `PaxHeaderKey.CHARSET` for more info
	 */
	public get charset(): string | undefined {
		return this.get(PaxHeaderKey.CHARSET);
	}

	/**
	 * See `PaxHeaderKey.COMMENT` for more info
	 */
	public get comment(): string | undefined {
		return this.get(PaxHeaderKey.COMMENT);
	}

	/**
	 * See `PaxHeaderKey.GROUP_ID` for more info
	 */
	public get groupId(): number | undefined {
		return this.getInt(PaxHeaderKey.GROUP_ID);
	}

	/**
	 * See `PaxHeaderKey.GROUP_NAME` for more info
	 */
	public get groupName(): string | undefined {
		return this.get(PaxHeaderKey.GROUP_NAME);
	}

	/**
	 * See `PaxHeaderKey.HDR_CHARSET` for more info
	 */
	public get hdrCharset(): string | undefined {
		return this.get(PaxHeaderKey.HDR_CHARSET);
	}

	/**
	 * See `PaxHeaderKey.LINK_PATH` for more info
	 */
	public get linkPath(): string | undefined {
		return this.get(PaxHeaderKey.LINK_PATH);
	}

	/**
	 * See `PaxHeaderKey.MODIFICATION_TIME` for more info
	 */
	public get modificationTime(): number | undefined {
		return this.getFloat(PaxHeaderKey.MODIFICATION_TIME);
	}

	/**
	 * See `PaxHeaderKey.PATH` for more info
	 */
	public get path(): string | undefined {
		return this.get(PaxHeaderKey.PATH);
	}

	/**
	 * See `PaxHeaderKey.SIZE` for more info
	 */
	public get size(): number | undefined {
		return this.getInt(PaxHeaderKey.SIZE);
	}

	/**
	 * See `PaxHeaderKey.USER_ID` for more info
	 */
	public get userId(): number | undefined {
		return this.getInt(PaxHeaderKey.USER_ID);
	}

	/**
	 * See `PaxHeaderKey.USER_NAME` for more info
	 */
	public get userName(): string | undefined {
		return this.get(PaxHeaderKey.USER_NAME);
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
	 * @returns an array of the segments in this header
	 */
	public values(): PaxHeaderSegment[] {
		return Object.values(this.valueMap);
	}

	/**
	 * Removes any unknown or un-standardized keys from this header.
	 * @returns `this` for operation chaining
	 */
	public clean(): this {
		for (const key of this.keys()) {
			if (!PaxHeaderUtility.isKnownHeaderKey(key)) {
				delete this.valueMap[key];
			}
		}

		return this;
	}

	/**
	 * @returns true if the value map of this parsed header contains the given key
	 */
	public has(key: PaxHeaderKey | string): boolean {
		return TarUtility.isDefined(this.valueMap[key]);
	}

	/**
	 * @returns the value parsed from the bytes of this header for the given key,
	 * or `undefined` if the key did not exist in the header.
	 */
	public get(key: PaxHeaderKey | string): string | undefined {
		return this.valueMap[key]?.value;
	}

	/**
	 * Parse the value for the given key as an int.
	 * @returns undefined if the key does not exist or the parse operation fails.
	 */
	public getInt(key: PaxHeaderKey | string): number | undefined {
		return this.valueMap[key]?.intValue;
	}

	/**
	 * Parse the value for the given key as a float.
	 * @returns undefined if the key does not exist or the parse operation fails.
	 */
	public getFloat(key: PaxHeaderKey | string): number | undefined {
		return this.valueMap[key]?.floatValue;
	}

	/**
	 * Serializes the underlying value map of this instance into a set of PAX sectors.
	 */
	public toUint8Array(): Uint8Array {
		return PaxHeader.serializeSegments(this.values());
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
		const { valueMap: attributes } = this;
		const bytes = this.toUint8Array();
		const buffer = TarUtility.getDebugBufferJson(bytes);

		return {
			attributes,
			buffer,
		};
	}
}
