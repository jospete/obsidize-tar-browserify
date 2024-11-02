import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';
import { TarHeaderUtility } from './tar-header-utility';

const {isTarHeaderLinkIndicatorTypePax} = TarHeaderUtility;

describe('TarHeaderUtility', () => {
	describe('isTarHeaderLinkIndicatorTypePax', () => {
		it('should return true for global pax header type', () => {
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER)).toBe(true);
		});
		
		it('should return true for local pax header type', () => {
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER)).toBe(true);
		});

		it('should return false for any non pax header type', () => {
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.UNKNOWN)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.NORMAL_FILE)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.NORMAL_FILE_ALT1)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.NORMAL_FILE_ALT2)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.HARD_LINK)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.SYMBOLIC_LINK)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.CHARACTER_SPECIAL)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.BLOCK_SPECIAL)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.DIRECTORY)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.FIFO)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax(TarHeaderLinkIndicatorType.CONTIGUOUS_FILE)).toBe(false);
			expect(isTarHeaderLinkIndicatorTypePax('')).toBe(false);
		});
	});
});
