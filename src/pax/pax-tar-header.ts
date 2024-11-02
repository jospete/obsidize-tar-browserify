import { TarUtility } from '../common/tar-utility';

const {
	parseIntSafe,
	decodeString
} = TarUtility;

export type PaxKeyValuePair = string[];

export enum PaxHeaderKey {
	/**
	 * A series of characters used as a comment. All characters in the <value> field shall be ignored by pax.
	 */
	COMMENT = 'comment',
	/**
	 * The group ID of the group that owns the file, expressed as a decimal number using
	 * digits from the ISO/IEC 646:1991 standard. This record shall override the gid 
	 * field in the following header block(s). When used in write or copy mode,
	 * pax shall include a gid extended header record for each file whose group ID is greater 
	 * than 2097151 (octal 7777777).
	 */
	GROUP_ID = 'gid',
	/**
	 * The group of the file(s), formatted as a group name in the group database.
	 * This record shall override the gid and gname fields in the following header block(s), 
	 * and any gid extended header record. When used in read, copy, or list mode,
	 * pax shall translate the name from the encoding in the header record to the character 
	 * set appropriate for the group database on the receiving system.
	 * If any of the characters cannot be translated, and if neither the -o invalid=UTF-8 option nor 
	 * the -o invalid=binary option is specified, the results are implementation-defined.
	 * When used in write or copy mode, pax shall include a gname extended header 
	 * record for each file whose group name cannot be represented entirely
	 * with the letters and digits of the portable character set.
	 */
	GROUP_NAME = 'gname',
	/**
	 * The name of the character set used to encode the value field of the
	 * gname, linkpath, path, and uname pax extended header records. The entries in the following 
	 * table are defined to refer to known standards;
	 * additional names may be agreed between the originator and the recipient.
	 */
	HDR_CHARSET = 'hdrcharset',
	/**
	 * The pathname of a link being created to another file, of any type, previously archived.
	 * This record shall override the linkname field in the following ustar header block(s).
	 * The following ustar header block shall determine the type of link created.
	 * If typeflag of the following header block is 1, it shall be a hard link.
	 * If typeflag is 2, it shall be a symbolic link and the linkpath value shall be
	 * the contents of the symbolic link. The pax utility shall translate the name of
	 * the link (contents of the symbolic link) from the encoding in the header to the
	 * character set appropriate for the local file system. When used in write or copy mode,
	 * pax shall include a linkpath extended header record for each link whose pathname cannot
	 * be represented entirely with the members of the portable character set other than NUL.
	 */
	LINK_PATH = 'linkpath',
	/**
	 * The file modification time of the following file(s),
	 * equivalent to the value of the st_mtime member of the stat structure for a file,
	 * as described in the stat() function. This record shall override the mtime field in the following header block(s).
	 * The modification time shall be restored if the process has appropriate privileges required to do so.
	 * The format of the <value> shall be as described in pax Extended Header File Times.
	 */
	MODIFICATION_TIME = 'mtime',
	/**
	 * The pathname of the following file(s). This record shall override the name and prefix fields in the following header block(s).
	 * The pax utility shall translate the pathname of the file from
	 * the encoding in the header to the character set appropriate for the local file system.
	 * 
	 * When used in write or copy mode, pax shall include a path extended header record for each file whose
	 * pathname cannot be represented entirely with the members of the portable character set other than NUL.
	 */
	PATH = 'path',
	/**
	 * The size of the file in octets, expressed as a decimal number using digits from the ISO/IEC 646:1991 standard.
	 * This record shall override the size field in the following header block(s). When used in write or copy mode,
	 * pax shall include a size extended header record for each file with a size value greater than 8589934591 (octal 77777777777).
	 */
	SIZE = 'size',
	/**
	 * The user ID of the file owner, expressed as a decimal number using digits from the ISO/IEC 646:1991 standard.
	 * This record shall override the uid field in the following header block(s). When used in write or copy mode,
	 * pax shall include a uid extended header record for each file whose owner ID is greater than 2097151 (octal 7777777).
	 */
	USER_ID = 'uid',
	/**
	 * The owner of the following file(s), formatted as a user name in the user database.
	 * This record shall override the uid and uname fields in the following header block(s),
	 * and any uid extended header record. When used in read, copy, or list mode,
	 * pax shall translate the name from the encoding in the header record to the character set appropriate for
	 * the user database on the receiving system. If any of the characters cannot be translated,
	 * and if neither the -o invalid=UTF-8 option nor the -o invalid=binary option is specified,
	 * the results are implementation-defined. When used in write or copy mode,
	 * pax shall include a uname extended header record for each file whose user name cannot
	 * be represented entirely with the letters and digits of the portable character set.
	 */
	USER_NAME = 'uname'
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
		for (const [key, value] of keyValuePairs) {
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
			const key = kvpData.substring(0, equalsDelimiterIndex);
			const value = kvpData.substring(equalsDelimiterIndex + 1).replace(/\n$/, '');
			pair = [key, value];
		}

		return {pair, bufferOffset, byteLength};
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
	public get groupId(): number {
		return TarUtility.parseIntSafe(this.get(PaxHeaderKey.GROUP_ID));
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
	public get modificationTime(): number {
		return TarUtility.parseFloatSafe(this.get(PaxHeaderKey.MODIFICATION_TIME));
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
	public get size(): number {
		return TarUtility.parseIntSafe(this.get(PaxHeaderKey.SIZE));
	}

	/**
	 * See `PaxHeaderKey.USER_ID` for more info
	 */
	public get userId(): number {
		return TarUtility.parseIntSafe(this.get(PaxHeaderKey.USER_ID));
	}

	/**
	 * See `PaxHeaderKey.USER_NAME` for more info
	 */
	public get userName(): string | undefined {
		return this.get(PaxHeaderKey.USER_NAME);
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
