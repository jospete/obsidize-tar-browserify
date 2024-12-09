import { TarUtility } from '../../dist';
import { hexToUint8Array, range } from '../test/test-util';
import { PaxTarHeaderKey } from './pax-tar-header-key';
import { PaxTarHeaderSegment } from './pax-tar-header-segment';

interface PaxHeaderTestMetadata {
	hex: string;
	text: string;
	key: string;
	value: string;
}

const paxHeaderHex = '32 32 37 20 70 61 74 68 3D 74 65 73 74 5F 74 61 72 2F 72 65 70 6F 73 69 74 6F 72 79 2F 61 73 73 65 74 73 2F 30 65 61 33 62 37 63 65 36 66 35 62 63 65 65 39 65 63 31 34 62 38 61 64 36 33 36 39 32 63 30 39 65 32 35 62 33 61 31 36 66 64 64 63 32 39 31 35 37 30 31 34 65 66 63 33 63 31 62 65 39 32 37 65 5F 5F 5F 37 32 64 32 66 32 66 35 65 65 32 39 65 33 65 37 30 33 65 62 63 63 35 66 36 64 31 38 39 35 30 38 31 61 38 64 33 66 66 31 37 36 32 33 66 64 37 64 64 61 33 61 33 37 32 39 63 63 36 62 62 30 32 65 5F 5F 5F 63 6F 6D 70 73 63 69 5F 30 31 5F 76 31 5F 41 64 76 69 63 65 5F 66 6F 72 5F 55 6E 68 61 70 70 79 5F 50 72 6F 67 72 61 6D 6D 65 72 73 5F 76 33 5F 6D 73 74 72 2E 74 78 74 0A 33 30 20 6D 74 69 6D 65 3D 31 37 32 39 31 32 39 30 37 35 2E 34 30 36 39 37 36 31 37 33 0A 31 32 31 20 4C 49 42 41 52 43 48 49 56 45 2E 78 61 74 74 72 2E 63 6F 6D 2E 61 70 70 6C 65 2E 71 75 61 72 61 6E 74 69 6E 65 3D 4D 44 49 34 4D 54 73 32 4E 7A 45 77 4E 6A 49 79 5A 54 74 47 61 58 4A 6C 5A 6D 39 34 4F 30 4E 46 51 30 56 44 4E 54 5A 43 4C 55 4A 44 52 44 41 74 4E 45 49 32 52 53 31 43 52 6A 6B 33 4C 55 49 33 51 7A 51 34 4F 44 4D 35 4D 6A 59 7A 4D 51 0A 39 36 20 53 43 48 49 4C 59 2E 78 61 74 74 72 2E 63 6F 6D 2E 61 70 70 6C 65 2E 71 75 61 72 61 6E 74 69 6E 65 3D 30 32 38 31 3B 36 37 31 30 36 32 32 65 3B 46 69 72 65 66 6F 78 3B 43 45 43 45 43 35 36 42 2D 42 43 44 30 2D 34 42 36 45 2D 42 46 39 37 2D 42 37 43 34 38 38 33 39 32 36 33 31 0A 36 39 20 4C 49 42 41 52 43 48 49 56 45 2E 78 61 74 74 72 2E 63 6F 6D 2E 61 70 70 6C 65 2E 6C 61 73 74 75 73 65 64 64 61 74 65 23 50 53 3D 62 6D 6F 51 5A 77 41 41 41 41 43 71 6E 78 63 57 41 41 41 41 41 41 0A';

const paxHeaderText = `227 path=test_tar/repository/assets/0ea3b7ce6f5bcee9ec14b8ad63692c09e25b3a16fddc29157014efc3c1be927e___72d2f2f5ee29e3e703ebcc5f6d1895081a8d3ff17623fd7dda3a3729cc6bb02e___compsci_01_v1_Advice_for_Unhappy_Programmers_v3_mstr.txt\n30 mtime=1729129075.406976173\n121 LIBARCHIVE.xattr.com.apple.quarantine=MDI4MTs2NzEwNjIyZTtGaXJlZm94O0NFQ0VDNTZCLUJDRDAtNEI2RS1CRjk3LUI3QzQ4ODM5MjYzMQ\n96 SCHILY.xattr.com.apple.quarantine=0281;6710622e;Firefox;CECEC56B-BCD0-4B6E-BF97-B7C488392631\n69 LIBARCHIVE.xattr.com.apple.lastuseddate#PS=bmoQZwAAAACqnxcWAAAAAA\n`;

const brokenHeaderSegment: PaxHeaderTestMetadata = {
	hex: '35 39 20 53 43 48 49 4C 59 2E 78 61 74 74 72 2E 63 6F 6D 2E 61 70 70 6C 65 2E 6C 61 73 74 75 73 65 64 64 61 74 65 23 50 53 3D 6E 6A 10 67 00 00 00 00 AA 9F 17 16 00 00 00 00 0A',
	text: '59 SCHILY.xattr.com.apple.lastuseddate#PS=nj\u0010g\u0000\u0000\u0000\u0000\u00AA\u009F\u0017\u0016\u0000\u0000\u0000\u0000\n',
	key: 'SCHILY.xattr.com.apple.lastuseddate#PS',
	value: 'nj\u0010g\u0000\u0000\u0000\u0000\u00AA\u009F\u0017\u0016\u0000\u0000\u0000\u0000'
};

const buildHeaderMetadataMap = (keys: string[]): Record<string, PaxHeaderTestMetadata> => {
	const count = keys.length;
	const paxHeaderHexSegments = paxHeaderHex.split('0A').slice(0, count).map(v => v.trim() + ' 0A');
	const paxHeaderTextSegments = paxHeaderText.split('\n').slice(0, count).map(v => v + '\n');
	const result: Record<string, PaxHeaderTestMetadata> = {};

	for (let i = 0; i < count; i++) {
		const segmentName = keys[i];
		const hex = paxHeaderHexSegments[i];
		const text = paxHeaderTextSegments[i];
		const match = /^\d+ ([^=]+)=([^\n]+)\n$/.exec(text);
		if (!match) throw new RangeError(`failed to parse line segment at index ${i} (segment name = ${segmentName})`);
		const [_, key, value] = match!;
		result[segmentName] = {hex, text, key, value};
	}

	return result;
};

const paxHeaderMetadataMap = buildHeaderMetadataMap([
	'path',
	'mtime',
	'libarchiveQuarantine',
	'schilyQuarantine',
	'libarchiveLastUsed'
]);

const pathTestKey = 'path';
const pathTestValue = 'test_tar/repository/assets/0ea3b7ce6f5bcee9ec14b8ad63692c09e25b3a16fddc29157014efc3c1be927e___72d2f2f5ee29e3e703ebcc5f6d1895081a8d3ff17623fd7dda3a3729cc6bb02e___compsci_01_v1_Advice_for_Unhappy_Programmers_v3_mstr.txt';
const pathTestHex = '32 32 37 20 70 61 74 68 3D 74 65 73 74 5F 74 61 72 2F 72 65 70 6F 73 69 74 6F 72 79 2F 61 73 73 65 74 73 2F 30 65 61 33 62 37 63 65 36 66 35 62 63 65 65 39 65 63 31 34 62 38 61 64 36 33 36 39 32 63 30 39 65 32 35 62 33 61 31 36 66 64 64 63 32 39 31 35 37 30 31 34 65 66 63 33 63 31 62 65 39 32 37 65 5F 5F 5F 37 32 64 32 66 32 66 35 65 65 32 39 65 33 65 37 30 33 65 62 63 63 35 66 36 64 31 38 39 35 30 38 31 61 38 64 33 66 66 31 37 36 32 33 66 64 37 64 64 61 33 61 33 37 32 39 63 63 36 62 62 30 32 65 5F 5F 5F 63 6F 6D 70 73 63 69 5F 30 31 5F 76 31 5F 41 64 76 69 63 65 5F 66 6F 72 5F 55 6E 68 61 70 70 79 5F 50 72 6F 67 72 61 6D 6D 65 72 73 5F 76 33 5F 6D 73 74 72 2E 74 78 74 0A';
const pathTestByteBuffer = hexToUint8Array(pathTestHex);

describe('PaxTarHeaderSegment', () => {
	it('should have a default constructor', () => {
		const segment = new PaxTarHeaderSegment();
		expect(segment).toBeTruthy();
	});

	describe('serialize()', () => {
		it('should serialize the given key/value pair into a PAX buffer segment', () => {
			const result = PaxTarHeaderSegment.serialize(pathTestKey, pathTestValue);
			expect(result).toEqual(pathTestByteBuffer);
		});

		describe('header segment variants', () => {
			let segmentHexAccumulator = '';

			for (const [segmentName, metadata] of Object.entries(paxHeaderMetadataMap)) {
				it(`should be able to serialize "${segmentName}" from paxHeaderMetadataMap`, () => {
					const {key, value, hex} = metadata;
					const serialized = PaxTarHeaderSegment.serialize(key, value);
					const serializedHex = TarUtility.getDebugHexString(serialized);
					expect(serializedHex).toBe(hex);
					segmentHexAccumulator += ' ' + serializedHex;
				});
			}

			it('should be able to regenerate the original hex block from individual segments', () => {
				expect(segmentHexAccumulator.trim()).toBe(paxHeaderHex);
			});
		});

		it('will NOT work for some custom headers', () => {
			const {key, value, hex} = brokenHeaderSegment;
			const serialized = PaxTarHeaderSegment.serialize(key, value);
			const serializedHex = TarUtility.getDebugHexString(serialized);
			expect(serializedHex).not.toBe(hex);
		});

		it('can handle edge case where the length field string size increases after the precalculation of it', () => {
			const key = PaxTarHeaderKey.PATH;
			// 92 characters + 7 metadata characters will give us 99, which should force a rollover into the 100s when length field is added
			const value = '81a8d3ff17623fd7dda3a3729cc6bb02e___compsci_01_v1_Advice_for_Unhappy_Programmers_v3_mstr.txt';
			const serializedBuffer = PaxTarHeaderSegment.serialize(key, value);
			const deserializedHeader = PaxTarHeaderSegment.tryParse(serializedBuffer);

			expect(deserializedHeader).toBeTruthy();
			expect(deserializedHeader!.key).toBe(key);
			expect(deserializedHeader!.value).toBe(value);
		});
	});

	describe('tryParse()', () => {
		it('should return null if it is not given a valid Uint8Array', () => {
			const invalidParameter: any = {potato: true};
			expect(PaxTarHeaderSegment.tryParse(invalidParameter)).toBe(null);
		});

		it('should return null if the buffer it is given is malformed', () => {
			const garbageBuffer1 = Uint8Array.from(range(5));
			expect(PaxTarHeaderSegment.tryParse(garbageBuffer1)).toBe(null);

			const garbageBuffer2 = new TextEncoder().encode('abc 123');
			expect(PaxTarHeaderSegment.tryParse(garbageBuffer2)).toBe(null);
		});
	});

	describe('toUint8Array()', () => {
		it('should return the serialized bytes from the given key and value', () => {
			const segment = new PaxTarHeaderSegment(pathTestKey, pathTestValue);
			const result = segment.toUint8Array();
			expect(result).toEqual(pathTestByteBuffer);
		});

		it('should only generate the bytes for a segment once', () => {
			const segment = new PaxTarHeaderSegment(pathTestKey, pathTestValue);
			const result1 = segment.toUint8Array();
			const result2 = segment.toUint8Array();
			expect(result1).not.toBe(null);
			expect(result2).toBe(result1);
		});
	});

	describe('toJSON()', () => {
		it('should return a valid serializable object', () => {
			const jsonObj = new PaxTarHeaderSegment().toJSON();
			expect(() => JSON.stringify(jsonObj)).not.toThrow();
		});
	});
});
