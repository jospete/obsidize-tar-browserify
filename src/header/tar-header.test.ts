import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeader } from '../header/tar-header';
import { TarHeaderUtility } from './tar-header-utility';
import { UstarHeader } from './ustar/ustar-header';
import { UstarHeaderLinkIndicatorType } from './ustar/ustar-header-link-indicator-type';

describe('TarHeader', () => {
	describe('from()', () => {
		it('should return the value as-is if it is already a TarHeader instance', () => {
			const header = new TarHeader({ ustar: new UstarHeader() });
			expect(TarHeader.fromAttributes(header)).toBe(header);
		});

		it('should correctly handle windows-based file paths', () => {
			const fileName =
				'test_tar\\repository\\assets\\_0ea3b7ce6f5bcee9ec14b8ad63692c09e25b3a16fddc29157014efc3c1be927e___72d2f2f5ee29e3e703ebcc5f6d1895081a8d3ff17623fd7dda3a3729cc6bb02e___compsci_01_v1_Advice_for_Unhappy_Programmers_v3_mstr.txt';
			const header = TarHeader.fromAttributes({ fileName });
			expect(header.pax).toBeDefined();
		});
	});

	describe('serializeAttributes()', () => {
		it('should use value as-is if it is already a TarHeader instance', () => {
			const header = new TarHeader({ ustar: new UstarHeader() });
			const buffer1 = header.toUint8Array();
			const buffer2 = TarHeader.serializeAttributes(header);
			expect(buffer1).toEqual(buffer2);
		});
	});

	describe('findNextUstarSectorOffset()', () => {
		it('returns the offset of the next header sector', () => {
			const testHeaderBuffer = TarHeader.serializeAttributes(null as any);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer)).toBe(0);
		});

		it('returns -1 when there is no ustar sector in the given scope', () => {
			expect(TarHeaderUtility.findNextUstarSectorOffset(null as any)).toBe(-1);
		});

		it('uses the given offset when it is provided', () => {
			const padLength = Constants.SECTOR_SIZE * 2;
			const paddingBuffer = new Uint8Array(padLength);
			const testHeaderBuffer = TarHeader.serializeAttributes(null as any);
			const combinedBuffer = TarUtility.concatUint8Arrays(paddingBuffer, testHeaderBuffer);

			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer)).toBe(padLength);
			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer, padLength)).toBe(padLength);
			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer, combinedBuffer.byteLength - 10)).toBe(-1);
		});

		it('snaps negative offsets to zero', () => {
			const testHeaderBuffer = TarHeader.serializeAttributes(null as any);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer, -1)).toBe(0);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer, -123456)).toBe(0);
		});
	});

	describe('isPaxHeader()', () => {
		it('should return true if the indicator is global extended type', () => {
			const header = TarHeader.fromAttributes({ typeFlag: UstarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER });
			expect(header.isPaxHeader).toBe(true);
			expect(header.isGlobalPaxHeader).toBe(true);
			expect(header.isLocalPaxHeader).toBe(false);
		});

		it('should return true if the indicator is local extended type', () => {
			const header = TarHeader.fromAttributes({ typeFlag: UstarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER });
			expect(header.isPaxHeader).toBe(true);
			expect(header.isGlobalPaxHeader).toBe(false);
			expect(header.isLocalPaxHeader).toBe(true);
		});

		it('should return false if the indicator is not a pax header type', () => {
			const header = TarHeader.fromAttributes({ typeFlag: UstarHeaderLinkIndicatorType.NORMAL_FILE });
			expect(header.isPaxHeader).toBe(false);
			expect(header.isGlobalPaxHeader).toBe(false);
			expect(header.isLocalPaxHeader).toBe(false);
		});
	});

	describe('toUint8Array()', () => {
		it('should correctly encode long pax file names', () => {
			const fileName =
				'test_tar/repository/assets/._0ea3b7ce6f5bcee9ec14b8ad63692c09e25b3a16fddc29157014efc3c1be927e___72d2f2f5ee29e3e703ebcc5f6d1895081a8d3ff17623fd7dda3a3729cc6bb02e___compsci_01_v1_Advice_for_Unhappy_Programmers_v3_mstr.txt';
			const fileNameTruncated =
				'._0ea3b7ce6f5bcee9ec14b8ad63692c09e25b3a16fddc29157014efc3c1be927e___72d2f2f5ee29e3e703ebcc5f6d1895\0';
			const header = TarHeader.fromAttributes({
				fileName,
				fileSize: 42,
				typeFlag: UstarHeaderLinkIndicatorType.NORMAL_FILE,
			});
			const headerBytes = header.toUint8Array();
			const start = Constants.SECTOR_SIZE * 2;
			const end = start + 100;
			const truncatedNameBytes = headerBytes.slice(start, end);
			const truncatedName = TarUtility.decodeString(truncatedNameBytes);
			expect(truncatedName).toBe(fileNameTruncated);
		});
	});
});
