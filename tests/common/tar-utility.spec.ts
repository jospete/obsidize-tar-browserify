import { TarUtility } from '../../src';
import { MockAsyncUint8Array } from '../mocks/mock-async-uint8array';

describe('TarUtility', () => {

	describe('parseIntSafe', () => {

		it('includes a radix parameter to match the native parseInt() api', () => {
			expect(TarUtility.parseIntSafe('1000', 2)).toBe(8);
		});

		it('includes a default radix of 10', () => {
			expect(TarUtility.parseIntSafe('1000')).toBe(1000);
		});

		it('provides a default value parameter for parse errors', () => {
			expect(TarUtility.parseIntSafe('not_a_number', 10, 42)).toBe(42);
		});

		it('leaves already-numeric numbers unaffected', () => {
			expect(TarUtility.parseIntSafe(100, 10, 42)).toBe(100);
		});
	});

	describe('removeTrailingZeros', () => {

		it('returns the given value ithout any NULL bytes at the end of it', () => {
			expect(TarUtility.removeTrailingZeros('test\u0000\u0000\u0000\u0000')).toBe('test');
		});

		it('does not modify values with no trailing zeros', () => {

			const paths = [
				'./test/path/to\u0000\u0000/a/file',
				'\0\u0000./test/path/to\u0000\0/a/file',
				'./test/path/to/a/file'
			];

			paths.forEach(path => {
				expect(TarUtility.removeTrailingZeros(path)).toBe(path);
			});
		});
	});

	describe('roundUpSectorOffset()', () => {

		it('advances the offset to the next sector block starting index', () => {
			expect(TarUtility.roundUpSectorOffset(TarUtility.SECTOR_SIZE - 2)).toBe(TarUtility.SECTOR_SIZE);
			expect(TarUtility.roundUpSectorOffset(TarUtility.SECTOR_SIZE + 1)).toBe(TarUtility.SECTOR_SIZE * 2);
		});

		it('does NOT advance the offset when it is already the start of a sector', () => {
			expect(TarUtility.roundUpSectorOffset(0)).toBe(0);
			expect(TarUtility.roundUpSectorOffset(TarUtility.SECTOR_SIZE)).toBe(TarUtility.SECTOR_SIZE);
		});
	});

	describe('advanceSectorOffsetUnclamped()', () => {

		it('advances the offset to the next sector block starting index', () => {
			expect(TarUtility.advanceSectorOffsetUnclamped(TarUtility.SECTOR_SIZE - 2)).toBe(TarUtility.SECTOR_SIZE);
			expect(TarUtility.advanceSectorOffsetUnclamped(TarUtility.SECTOR_SIZE + 1)).toBe(TarUtility.SECTOR_SIZE * 2);
		});

		it('advances the offset when it is already the start of a sector', () => {
			expect(TarUtility.advanceSectorOffsetUnclamped(0)).toBe(TarUtility.SECTOR_SIZE);
			expect(TarUtility.advanceSectorOffsetUnclamped(TarUtility.SECTOR_SIZE)).toBe(TarUtility.SECTOR_SIZE * 2);
		});
	});

	describe('decodeString()', () => {

		it('returns an empty string when the given value is not a valid Uint8Array', () => {
			expect(TarUtility.decodeString(null as any)).toBe('');
		});
	});

	describe('generateChecksum()', () => {

		it('returns zero when the given value is not a valid Uint8Array', () => {
			expect(TarUtility.generateChecksum(null as any)).toBe(0);
		});
	});

	describe('concatUint8Arrays()', () => {

		it('returns the second value when the first is not a Uint8Array', () => {
			const a: any = null;
			const b = new Uint8Array(5);
			expect(TarUtility.concatUint8Arrays(a, b)).toBe(b);
		});

		it('does nothing when given blank instances', () => {
			const a = new Uint8Array(0);
			const b = new Uint8Array(0);
			let result: Uint8Array | null = null;
			expect(() => result = TarUtility.concatUint8Arrays(a, b)).not.toThrowError();
			expect(result!.byteLength).toBe(0);
		});
	});

	describe('findInAsyncUint8Array()', () => {

		it('returns the first slice when a predicate is not given', async () => {
			const a = null;
			const buffer = new Uint8Array(1024);
			const asyncBuffer = new MockAsyncUint8Array(buffer);
			const result = await TarUtility.findInAsyncUint8Array(asyncBuffer);
			expect(result!.value.byteLength).toBe(512);
		});
	});
});