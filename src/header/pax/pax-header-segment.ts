import { TarSerializable, TarUtility } from '../../common/tar-utility';

const ASCII_SPACE = 0x20;
const KEY_VALUE_SEPARATOR = '=';

/**
 * Single segment in a PAX header block, represented by a text line with the format:
 * ```LENGTH KEY=VALUE\n```
 */
export class PaxHeaderSegment implements TarSerializable {
	constructor(
		private mKey: string = '',
		private mValue: string = '',
		private mBytes: Uint8Array | null = null
	) {
	}

	public static serialize(key: string, value: string): Uint8Array {
		if (!key || !value) {
			return new Uint8Array(0);
		}

		const segmentSuffix = ` ${key}=${value}\n`;
		const preCalculatedLength = segmentSuffix.length.toString().length;
		let segmentLength = segmentSuffix.length + preCalculatedLength;

		// Calculation caused decimal rollover, increase combined length by 1
		// (e.g. including the length part caused combined length to go from something like '99' to '101')
		if (segmentLength < (segmentLength.toString().length + segmentSuffix.length)) {
			segmentLength += 1;
		}

		const segment = segmentLength.toString() + segmentSuffix;
		return TarUtility.encodeString(segment);
	}

	public static deserialize(bytes: Uint8Array, offset: number = 0): PaxHeaderSegment | null {
		if (!TarUtility.isUint8Array(bytes)) {
			return null;
		}

		const lengthEndIndex = PaxHeaderSegment.findNextLengthEndIndex(bytes, offset);

		if (lengthEndIndex < 0) {
			return null;
		}

		const segmentLengthStr = TarUtility.decodeString(bytes.slice(offset, lengthEndIndex));
		const segmentLength = parseInt(segmentLengthStr, 10);

		if (isNaN(segmentLength)) {
			return null;
		}

		const kvpStart = lengthEndIndex + 1;
		const kvpEnd = offset + segmentLength;
		const kvpData = TarUtility.decodeString(bytes.slice(kvpStart, kvpEnd));
		const equalsDelimiterIndex = kvpData.indexOf(KEY_VALUE_SEPARATOR);
		const key = kvpData.substring(0, equalsDelimiterIndex);
		const value: string = kvpData.substring(equalsDelimiterIndex + 1).replace(/\n$/, '');
		const segmentBytes = TarUtility.cloneUint8Array(bytes, offset, offset + segmentLength);

		return new PaxHeaderSegment(key, value, segmentBytes);
	}

	private static findNextLengthEndIndex(bytes: Uint8Array, offset: number): number {
		let lengthEnd = offset + 1;

		while (lengthEnd < bytes.byteLength) {
			if (bytes[lengthEnd] === ASCII_SPACE) {
				return lengthEnd;
			} else {
				lengthEnd += 1;
			}
		}

		return -1;
	}

	public get key(): string {
		return this.mKey;
	}

	public get value(): string {
		return this.mValue;
	}

	public get bytes(): Uint8Array {
		return this.toUint8Array();
	}

	/**
	 * the value parsed as an integer, or undefined if the parse operation fails
	 */
	public get intValue(): number | undefined {
		const parsed = parseInt(this.value);
		return isNaN(parsed) ? undefined : parsed;
	}

	/**
	 * the value parsed as a float, or undefined if the parse operation fails
	 */
	public get floatValue(): number | undefined {
		const parsed = parseFloat(this.value);
		return isNaN(parsed) ? undefined : parsed;
	}

	public toUint8Array(): Uint8Array {
		if (!TarUtility.isUint8Array(this.mBytes)) {
			this.mBytes = PaxHeaderSegment.serialize(this.key, this.value);
		}
		
		return this.mBytes;
	}

	public toJSON(): any {
		const {key, value, bytes} = this;
		const content = TarUtility.getDebugHexString(bytes);

		return {
			key,
			value,
			content
		};
	}
}
