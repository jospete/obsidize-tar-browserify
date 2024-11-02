import { TarUtility } from '../common/tar-utility';
import { PaxTarHeaderKey } from './pax-tar-header-key';

const {
	parseIntSafe,
	decodeString
} = TarUtility;

export interface PaxKeyValuePair {
	key: PaxTarHeaderKey;
	value: string;
}

interface PaxKeyValuePairParseResult {
	pair: PaxKeyValuePair | null;
	bufferOffset: number;
	byteLength: number;
}

interface PaxParseResult {
	pairs: PaxKeyValuePair[];
	endIndex: number;
}

const ASCII_SPACE = 0x20;

/**
 * Adds support for extended headers.
 * https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_03
 */
export class PaxTarHeader {
	private readonly valueMap: Record<string, string>;

	constructor(
		keyValuePairs: PaxKeyValuePair[] = [],
		public readonly bytes: Uint8Array | null = null,
		public readonly offset: number = 0,
		public readonly endIndex: number = 0
	) {
		this.valueMap = {};
		for (const {key, value} of keyValuePairs) {
			this.valueMap[key] = value;
		}
	}

	public static from(buffer: Uint8Array, offset: number): PaxTarHeader {
		const {pairs, endIndex} = PaxTarHeader.parseKeyValuePairs(buffer, offset);
		const slicedBuffer = TarUtility.cloneUint8Array(buffer, offset, endIndex);
		return new PaxTarHeader(pairs, slicedBuffer, offset, endIndex);
	}

	private static parseKeyValuePairs(buffer: Uint8Array, offset: number): PaxParseResult {
		const pairs: PaxKeyValuePair[] = [];
		let cursor = offset;
		let next = PaxTarHeader.parseNextKeyValuePair(buffer, cursor);

		while (next?.pair !== null) {
			pairs.push(next.pair);
			cursor += next.byteLength;
			next = PaxTarHeader.parseNextKeyValuePair(buffer, cursor);
		}

		return {pairs, endIndex: cursor};
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
