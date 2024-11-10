import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeaderField } from '../header/tar-header-field';
import { PaxTarHeaderKey } from './pax-tar-header-key';

const {
	parseIntSafe,
	decodeString
} = TarUtility;

interface PaxKeyValuePair {
	key: PaxTarHeaderKey;
	value: string;
}

interface PaxKeyValuePairParseResult {
	pair: PaxKeyValuePair | null;
	bufferOffset: number;
	byteLength: number;
}

interface PaxParseResult {
	attributes: Partial<PaxTarHeaderAttributes>;
	endIndex: number;
}

const ASCII_SPACE = 0x20;

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
export class PaxTarHeader {
	private readonly valueMap: Partial<PaxTarHeaderAttributes>;
	private mSectorByteLength: number | undefined;

	constructor(
		attributes: PaxTarHeaderAttributes | Partial<PaxTarHeaderAttributes> = {},
		public readonly bytes: Uint8Array | null = null,
		public readonly offset: number = 0,
		public readonly endIndex: number = 0
	) {
		this.valueMap = Object.freeze(Object.assign({}, attributes));
	}

	public static from(buffer: Uint8Array, offset: number = 0): PaxTarHeader {
		const {attributes, endIndex} = PaxTarHeader.parseKeyValuePairs(buffer, offset);
		const slicedBuffer = TarUtility.cloneUint8Array(buffer, offset, endIndex);
		return new PaxTarHeader(attributes, slicedBuffer, offset, endIndex);
	}

	public static serialize(attributes: Partial<PaxTarHeaderAttributes> | null): Uint8Array {
		if (!TarUtility.isObject(attributes)) {
			return new Uint8Array(0);
		}

		let totalLength = 0;
		let segmentBuffers: Uint8Array[] = [];

		for (const [key, value] of Object.entries(attributes)) {
			const segmentSuffix = ` ${key}=${value}\n`;
			const preCalculatedLength = segmentSuffix.length.toString().length;
			let segmentLength = segmentSuffix.length + preCalculatedLength;

			// Calculation caused decimal rollover, increase combined length by 1
			// (e.g. including the length part caused combined length to go from something like '99' to '101')
			if (segmentLength < (segmentLength.toString().length + segmentSuffix.length)) {
				segmentLength += 1;
			}

			const segment = segmentLength.toString() + segmentSuffix;
			const encodedSegment = TarUtility.encodeString(segment);

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

	private static parseKeyValuePairs(buffer: Uint8Array, offset: number): PaxParseResult {
		const attributes: Partial<PaxTarHeaderAttributes> = {};
		let cursor = offset;
		let next = PaxTarHeader.parseNextKeyValuePair(buffer, cursor);

		while (next.pair !== null) {
			const {key, value} = next.pair;
			attributes[key] = value;
			cursor += next.byteLength;
			next = PaxTarHeader.parseNextKeyValuePair(buffer, cursor);
		}

		return {attributes, endIndex: cursor};
	}

	private static parseNextKeyValuePair(buffer: Uint8Array, offset: number): PaxKeyValuePairParseResult {
		let pair: PaxKeyValuePair | null = null;
		const bufferOffset = offset;
		let lengthEnd = offset;

		while (lengthEnd < buffer.length && buffer[lengthEnd] !== ASCII_SPACE) {
			lengthEnd += 1;
		}

		const byteLength = parseIntSafe(decodeString(buffer.slice(bufferOffset, lengthEnd)));
		const end = bufferOffset + byteLength;

		if (byteLength > 0) {
			const kvpData = decodeString(buffer.slice(lengthEnd + 1, end));
			const equalsDelimiterIndex = kvpData.indexOf('=');
			const key = kvpData.substring(0, equalsDelimiterIndex) as PaxTarHeaderKey;
			const value: string = kvpData.substring(equalsDelimiterIndex + 1).replace(/\n$/, '');
			pair = {key, value};
		}

		return {pair, bufferOffset, byteLength};
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
	public get groupId(): number {
		return TarUtility.parseIntSafe(this.get(PaxTarHeaderKey.GROUP_ID));
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
	public get modificationTime(): number {
		return TarUtility.parseFloatSafe(this.get(PaxTarHeaderKey.MODIFICATION_TIME));
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
	public get size(): number {
		return TarUtility.parseIntSafe(this.get(PaxTarHeaderKey.SIZE));
	}

	/**
	 * See `PaxTarHeaderKey.USER_ID` for more info
	 */
	public get userId(): number {
		return TarUtility.parseIntSafe(this.get(PaxTarHeaderKey.USER_ID));
	}

	/**
	 * See `PaxTarHeaderKey.USER_NAME` for more info
	 */
	public get userName(): string | undefined {
		return this.get(PaxTarHeaderKey.USER_NAME);
	}

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
		return this.valueMap[key];
	}

	/**
	 * Serializes the underlying value map of this instance into a set of PAX sectors.
	 */
	public toUint8Array(): Uint8Array {
		return PaxTarHeader.serialize(this.valueMap);
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
		const {valueMap, bytes, offset, endIndex} = this;
		const byteLength = bytes?.byteLength ?? 0;
		const content = TarUtility.getDebugHexString(bytes);

		return {
			offset,
			endIndex,
			valueMap,
			byteLength,
			content
		};
	}
}
