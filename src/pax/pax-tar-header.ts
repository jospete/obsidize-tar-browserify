import { TarUtility } from '../common/tar-utility';

const {
	parseIntSafe,
	decodeString
} = TarUtility;

export type PaxKeyValuePair = string[];

interface PaxKeyValuePairParseResult {
	pair: PaxKeyValuePair | null;
	bufferOffset: number;
	byteLength: number;
}

const ASCII_SPACE = 0x20;

/**
 * Adds support for extended headers.
 * https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_03
 */
export class PaxTarHeader {
	private readonly valueMap = new Map<string, string>();

	constructor(pairs: PaxKeyValuePair[] = []) {
		this.populateValueMap(pairs);
	}

	public static from(buffer: Uint8Array, offset: number = 0): PaxTarHeader {
		return new PaxTarHeader(PaxTarHeader.parseKeyValuePairs(buffer, offset));
	}

	private static parseKeyValuePairs(buffer: Uint8Array, offset: number = 0): PaxKeyValuePair[] {
		const result: PaxKeyValuePair[] = [];
		let cursor = offset;
		let next = PaxTarHeader.parseNextKeyValuePair(buffer, cursor);

		while (next?.pair !== null) {
			result.push(next.pair);
			cursor = next.byteLength + 1;
			next = PaxTarHeader.parseNextKeyValuePair(buffer, cursor);
		}

		return result;
	}

	private static parseNextKeyValuePair(buffer: Uint8Array, offset: number = 0): PaxKeyValuePairParseResult {
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
			let value = kvpData.substring(equalsDelimiterIndex + 1);

			if (value.endsWith('\n')) {
				value = value.substring(0, value.length - 1);
			}

			pair = [key, value];
		}

		return {pair, bufferOffset, byteLength};
	}

	private populateValueMap(pairs: PaxKeyValuePair[]): void {
		this.valueMap.clear();
		for (const [key, value] of pairs) {
			this.valueMap.set(key, value);
		}
	}
}
