import { Constants } from '../../common/constants';
import { TarUtility } from '../../common/tar-utility';
import { TarHeaderUtility } from '../tar-header-utility';
import { UstarHeader } from './ustar-header';
import { UstarHeaderField } from './ustar-header-field';
import { UstarHeaderLinkIndicatorType } from './ustar-header-link-indicator-type';

describe('UstarHeader', () => {
	it('can be safely stringified', () => {
		const header = new UstarHeader();
		expect(() => JSON.stringify(header)).not.toThrow();
	});

	it('populates missing fields with sensible defaults', () => {
		const header = new UstarHeader();
		expect(header).not.toBeFalsy();
		expect(header.fileMode).toBe(Constants.FILE_MODE_DEFAULT);
		expect(header.typeFlag).toBe(UstarHeaderLinkIndicatorType.NORMAL_FILE);
	});

	it('consistently encodes and decodes the same header buffer', () => {
		const header1 = UstarHeader.fromAttributes({
			fileName: 'Test File.txt',
			fileSize: 50000,
			fileMode: 450,
		});

		const headerBuffer1 = UstarHeader.serializeAttributes(header1);
		expect(TarUtility.isUint8Array(headerBuffer1)).toBe(true);
		expect(headerBuffer1.byteLength).toBe(Constants.HEADER_SIZE);

		const header2 = UstarHeader.deserialize(headerBuffer1)!;
		const headerBuffer2 = header2.toUint8Array();
		expect(headerBuffer2).toEqual(headerBuffer1);

		// We should be able to serialize and deserialize the same header multiple times without any data loss.
		const header3 = UstarHeader.deserialize(headerBuffer2)!;
		expect(header3.fileName).toBe(header1.fileName);
		expect(header3.fileSize).toBe(header1.fileSize);
		expect(header3.fileMode).toBe(header1.fileMode);
	});

	describe('fromAttributes()', () => {
		it('returns the input value as-is if it is already a UstarHeader instance', () => {
			const header = new UstarHeader();
			const parsedHeader = UstarHeader.fromAttributes(header);
			expect(parsedHeader).toBe(header);
		});
	});

	describe('update()', () => {
		it('applies given values to the backing buffer', () => {
			const fileMode = 511;
			const header = new UstarHeader();

			header.update({ fileMode });

			const headerBytes = header.toUint8Array();
			const bufferText = TarUtility.decodeString(UstarHeaderField.fileMode.slice(headerBytes));

			expect(header.fileMode).toBe(fileMode);
			expect(bufferText).toBe('000777 \0');
		});
	});

	describe('deserialize()', () => {
		it('should return null if the input is not a valid ustar sector', () => {
			expect(UstarHeader.deserialize(new Uint8Array())).toBe(null);
		});
	});

	describe('findNextUstarSectorOffset()', () => {
		it('returns the offset of the next header sector', () => {
			const testHeaderBuffer = UstarHeader.serializeAttributes(null as any);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer)).toBe(0);
		});

		it('returns -1 when there is no ustar sector in the given scope', () => {
			expect(TarHeaderUtility.findNextUstarSectorOffset(null as any)).toBe(-1);
		});

		it('uses the given offset when it is provided', () => {
			const padLength = Constants.SECTOR_SIZE * 2;
			const paddingBuffer = new Uint8Array(padLength);
			const testHeaderBuffer = UstarHeader.serializeAttributes(null as any);
			const combinedBuffer = TarUtility.concatUint8Arrays(paddingBuffer, testHeaderBuffer);

			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer)).toBe(padLength);
			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer, padLength)).toBe(padLength);
			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer, combinedBuffer.byteLength - 10)).toBe(-1);
		});

		it('snaps negative offsets to zero', () => {
			const testHeaderBuffer = UstarHeader.serializeAttributes(null as any);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer, -1)).toBe(0);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer, -123456)).toBe(0);
		});
	});

	describe('isPaxHeader()', () => {
		it('should return true if the indicator is global extended type', () => {
			const header = UstarHeader.fromAttributes({
				typeFlag: UstarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER,
			});
			expect(header.isPaxHeader).toBe(true);
			expect(header.isGlobalPaxHeader).toBe(true);
			expect(header.isLocalPaxHeader).toBe(false);
		});

		it('should return true if the indicator is local extended type', () => {
			const header = UstarHeader.fromAttributes({ typeFlag: UstarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER });
			expect(header.isPaxHeader).toBe(true);
			expect(header.isGlobalPaxHeader).toBe(false);
			expect(header.isLocalPaxHeader).toBe(true);
		});

		it('should return false if the indicator is not a pax header type', () => {
			const header = UstarHeader.fromAttributes({ typeFlag: UstarHeaderLinkIndicatorType.NORMAL_FILE });
			expect(header.isPaxHeader).toBe(false);
			expect(header.isGlobalPaxHeader).toBe(false);
			expect(header.isLocalPaxHeader).toBe(false);
		});
	});

	describe('field setters', () => {
		it('should overwrite the field value for the header', () => {
			const header = new UstarHeader();

			header.fileName = 'potato.txt';
			expect(header.fileName).toBe('potato.txt');

			header.fileMode = 777;
			expect(header.fileMode).toBe(777);

			header.ownerUserId = 1;
			expect(header.ownerUserId).toBe(1);

			header.groupUserId = 2;
			expect(header.groupUserId).toBe(2);

			header.linkedFileName = 'another potato.txt';
			expect(header.linkedFileName).toBe('another potato.txt');

			header.typeFlag = UstarHeaderLinkIndicatorType.BLOCK_SPECIAL;
			expect(header.typeFlag).toBe(UstarHeaderLinkIndicatorType.BLOCK_SPECIAL);

			header.ustarVersion = '22';
			expect(header.ustarVersion).toBe('22');

			header.ownerUserName = 'owner';
			expect(header.ownerUserName).toBe('owner');

			header.ownerGroupName = 'group';
			expect(header.ownerGroupName).toBe('group');

			header.deviceMajorNumber = '69';
			expect(header.deviceMajorNumber).toBe('69');

			header.deviceMinorNumber = '420';
			expect(header.deviceMinorNumber).toBe('420');

			header.fileNamePrefix = 'v3_final_this_time_for_sure';
			expect(header.fileNamePrefix).toBe('v3_final_this_time_for_sure');

			const now = Date.now();
			header.lastModified = now;
			expect(header.lastModified).toBe(TarUtility.sanitizeDateTimeAsUstar(now));
		});
	});
});
