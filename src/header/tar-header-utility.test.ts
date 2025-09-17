import { TarHeaderUtility } from './tar-header-utility.ts';
import { UstarHeaderLinkIndicatorType } from './ustar/ustar-header-link-indicator-type.ts';

const { isTarHeaderLinkIndicatorTypePax } = TarHeaderUtility;

describe('TarHeaderUtility', () => {
	describe('isTarHeaderLinkIndicatorTypePax', () => {
		it('should return true for global pax header type', () => {
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER)).toBe(true);
		});

		it('should return true for local pax header type', () => {
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER)).toBe(true);
		});

		it('should return false for any non pax header type', () => {
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.UNKNOWN)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.NORMAL_FILE)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.NORMAL_FILE_ALT1)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.NORMAL_FILE_ALT2)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.HARD_LINK)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.SYMBOLIC_LINK)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.CHARACTER_SPECIAL)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.BLOCK_SPECIAL)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.DIRECTORY)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.FIFO)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(UstarHeaderLinkIndicatorType.CONTIGUOUS_FILE)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax('')).toBe(false);
		});
	});
});
