import { Constants } from './constants.ts';
import { TarUtility } from './tar-utility.ts';

const {
	ustarTimeToDate,
	dateTimeToUstar,
	paxTimeToUstar,
	advanceSectorOffsetUnclamped,
	concatUint8Arrays,
	decodeString,
	encodeString,
	generateChecksum,
	parseIntOctal,
	parseIntSafe,
	removeTrailingZeros,
	roundUpSectorOffset,
	getSectorOffsetDelta,
	parseFloatSafe,
	cloneUint8Array,
	getDebugBufferJson,
} = TarUtility;

const { SECTOR_SIZE } = Constants;

const staticDateTime = 1632419077000;
const staticDateTimeEncoded = 1632419077;

describe('TarUtility', () => {
	describe('parseIntSafe', () => {
		it('includes a radix parameter to match the native parseInt() api', () => {
			expect(parseIntSafe('1000', 2)).toBe(8);
		});

		it('includes a default radix of 10', () => {
			expect(parseIntSafe('1000')).toBe(1000);
		});

		it('provides a default value parameter for parse errors', () => {
			expect(parseIntSafe('not_a_number', 10, 42)).toBe(42);
		});

		it('leaves already-numeric numbers unaffected', () => {
			expect(parseIntSafe(100, 10, 42)).toBe(100);
		});
	});

	describe('removeTrailingZeros', () => {
		it('returns the given value ithout any NULL bytes at the end of it', () => {
			expect(removeTrailingZeros('test\u0000\u0000\u0000\u0000')).toBe('test');
		});

		it('does not modify values with no trailing zeros', () => {
			const paths = [
				'./test/path/to\u0000\u0000/a/file',
				'\0\u0000./test/path/to\u0000\0/a/file',
				'./test/path/to/a/file',
			];

			paths.forEach((path) => {
				expect(removeTrailingZeros(path)).toBe(path);
			});
		});
	});

	describe('roundUpSectorOffset()', () => {
		it('advances the offset to the next sector block starting index', () => {
			expect(roundUpSectorOffset(SECTOR_SIZE - 2)).toBe(SECTOR_SIZE);
			expect(roundUpSectorOffset(SECTOR_SIZE + 1)).toBe(SECTOR_SIZE * 2);
		});

		it('does NOT advance the offset when it is already the start of a sector', () => {
			expect(roundUpSectorOffset(0)).toBe(0);
			expect(roundUpSectorOffset(SECTOR_SIZE)).toBe(SECTOR_SIZE);
		});
	});

	describe('advanceSectorOffsetUnclamped()', () => {
		it('advances the offset to the next sector block starting index', () => {
			expect(advanceSectorOffsetUnclamped(SECTOR_SIZE - 2)).toBe(SECTOR_SIZE);
			expect(advanceSectorOffsetUnclamped(SECTOR_SIZE + 1)).toBe(SECTOR_SIZE * 2);
		});

		it('advances the offset when it is already the start of a sector', () => {
			expect(advanceSectorOffsetUnclamped(0)).toBe(SECTOR_SIZE);
			expect(advanceSectorOffsetUnclamped(SECTOR_SIZE)).toBe(SECTOR_SIZE * 2);
		});
	});

	describe('getSectorOffsetDelta()', () => {
		it('returns the remaining bytes between the given offset and what would be the next block-sized offset', () => {
			expect(getSectorOffsetDelta(0)).toBe(0);
			expect(getSectorOffsetDelta(SECTOR_SIZE)).toBe(0);
			expect(getSectorOffsetDelta(SECTOR_SIZE - 5)).toBe(5);
			expect(getSectorOffsetDelta(SECTOR_SIZE + 10)).toBe(SECTOR_SIZE - 10);
		});
	});

	describe('decodeString()', () => {
		it('returns an empty string when the given value is not a valid Uint8Array', () => {
			expect(decodeString(null as any)).toBe('');
		});
	});

	describe('encodeString()', () => {
		it('returns an empty Uint8Array when the value is not a populated string', () => {
			const emptyUint8 = new Uint8Array(0);
			expect(encodeString(null as any)).toEqual(emptyUint8);
			expect(encodeString('')).toEqual(emptyUint8);
		});
	});

	describe('generateChecksum()', () => {
		it('returns zero when the given value is not a valid Uint8Array', () => {
			expect(generateChecksum(null as any)).toBe(0);
		});
	});

	describe('concatUint8Arrays()', () => {
		it('returns the second value when the first is not a Uint8Array', () => {
			const a: any = null;
			const b = new Uint8Array(5);
			expect(concatUint8Arrays(a, b)).toBe(b);
		});

		it('returns the first value when the second is not a Uint8Array', () => {
			const a = new Uint8Array(5);
			const b: any = null;
			expect(concatUint8Arrays(a, b)).toBe(a);
		});

		it('does nothing when given blank instances', () => {
			const a = new Uint8Array(0);
			const b = new Uint8Array(0);
			let result: Uint8Array | null = null;
			expect(() => (result = concatUint8Arrays(a, b))).not.toThrowError();
			expect(result!.byteLength).toBe(0);
		});
	});

	describe('ustarTimeToDate()', () => {
		it('converts the encoded value to a valid date time', () => {
			expect(ustarTimeToDate(staticDateTimeEncoded)).toBe(staticDateTime);
		});

		it('floors floating point values', () => {
			expect(ustarTimeToDate(staticDateTimeEncoded + 0.9)).toBe(staticDateTime);
		});
	});

	describe('dateTimeToUstar()', () => {
		it('encodes the value to a serializable mtime', () => {
			expect(dateTimeToUstar(staticDateTime)).toBe(staticDateTimeEncoded);
		});

		it('floors floating point values', () => {
			expect(dateTimeToUstar(staticDateTime + 0.9)).toBe(staticDateTimeEncoded);
		});
	});

	describe('paxTimeToUstar()', () => {
		it('converts a pax mtime to a ustar mtime', () => {
			expect(paxTimeToUstar(123.789)).toBe(123);
		});
	});

	describe('parseIntOctal()', () => {
		it('translates the given octal string into a number', () => {
			expect(parseIntOctal('777')).toBe(parseInt('777', 8));
		});

		it('removes trailing zeroes and white space', () => {
			expect(parseIntOctal('0000777 \0\0\0\0')).toBe(parseInt('777', 8));
		});

		it('returns a default value when the given input cannot be parsed to a number', () => {
			expect(parseIntOctal(null as any)).toBe(0);
		});
	});

	describe('parseFloatSafe()', () => {
		it('should properly parse a float value from a string', () => {
			expect(parseFloatSafe('123.123')).toBe(123.123);
		});

		it('should return the given default value on parse error', () => {
			expect(parseFloatSafe('fff123.123', 42.69)).toBe(42.69);
		});

		it('should return the given value as-is if it is already a number', () => {
			expect(parseFloatSafe(5)).toBe(5);
			expect(parseFloatSafe(42.69)).toBe(42.69);
		});
	});

	describe('cloneUint8Array()', () => {
		it('should make a completely isolated deep copy of the given input', () => {
			const input = Uint8Array.from([1, 2, 3, 4]);
			const cloned = cloneUint8Array(input);
			input[0] = 5;
			expect(cloned).not.toBe(input);
			expect(cloned).not.toEqual(input);
			expect(input[0]).toBe(5);
			expect(cloned[0]).toBe(1);
		});

		it('return an empty instance if the input is not a valid Uint8Array', () => {
			expect(cloneUint8Array(null)).toEqual(new Uint8Array(0));
		});
	});

	describe('getDebugBufferJson()', () => {
		it('should return a byte length of zero for invalid input', () => {
			expect(getDebugBufferJson(null).byteLength).toBe(0);
		});
	});
});
