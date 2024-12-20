import { Constants } from '../../common/constants';
import { TarUtility } from '../../common/tar-utility';
import { TarHeaderUtility } from '../tar-header-utility';
import { UstarHeader } from './ustar-header';
import { UstarHeaderField } from './ustar-header-field';
import { UstarHeaderLinkIndicatorType } from './ustar-header-link-indicator-type';

describe('UstarHeader', () => {
	it('can be created with an explicit buffer and offset', () => {
		const blockSize = Constants.HEADER_SIZE;
		const offset = blockSize;
		const bufferLength = blockSize * 2;
		const buffer = new Uint8Array(bufferLength);
		const header = new UstarHeader(buffer, offset);
		const updatedFileMode = 123;

		expect(header.fileMode).toBe(0);

		header.fileMode = updatedFileMode;
		expect(UstarHeaderField.fileMode.readFrom(buffer, offset)).toBe(updatedFileMode);
	});

	it('returns a type flag of UNKNOWN when it fails to retrieve the type flag info', () => {
		const header = new UstarHeader(new Uint8Array(10));
		expect(header.typeFlag).toBe(UstarHeaderLinkIndicatorType.UNKNOWN);
	});

	it('can be safely stringified', () => {
		const header = UstarHeader.seeded();
		expect(() => JSON.stringify(header)).not.toThrow();
	});

	describe('from()', () => {
		it('returns the input value as-is if it is already a UstarHeader instance', () => {
			const header = new UstarHeader();
			const parsedHeader = UstarHeader.from(header);
			expect(parsedHeader).toBe(header);
		});
	});

	describe('initialize()', () => {
		it('applies default values if no custom object is given', () => {
			const header = new UstarHeader();

			expect(header.deviceMajorNumber).toBe('');
			expect(header.fileMode).toBe(0);

			header.initialize();

			expect(header.deviceMajorNumber).toBe('00');
			expect(header.fileMode).toBe(Constants.FILE_MODE_DEFAULT);
		});

		it('applies default options if the options parameter is falsy', () => {
			const header = new UstarHeader();

			expect(header.deviceMajorNumber).toBe('');
			expect(header.fileMode).toBe(0);

			header.initialize({});

			expect(header.deviceMajorNumber).toBe('00');
			expect(header.fileMode).toBe(Constants.FILE_MODE_DEFAULT);
		});
	});

	describe('update()', () => {
		it('applies given values to the backing buffer', () => {
			const fileMode = 511;
			const header = new UstarHeader();

			header.update({fileMode});
			const bufferText = TarUtility.decodeString(UstarHeaderField.fileMode.slice(header.bytes));

			expect(header.fileMode).toBe(fileMode);
			expect(bufferText).toBe('000777 \0');
		});

		it('does nothing if the given attributes are malformed', () => {
			const header = new UstarHeader();
			jest.spyOn(header, 'updateChecksum');

			header.update(null as any);
			expect(header.updateChecksum).not.toHaveBeenCalled();

			header.update({});
			expect(header.updateChecksum).not.toHaveBeenCalled();

			header.update({fileMode: 123});
			expect(header.updateChecksum).toHaveBeenCalledTimes(1);
		});
	});

	describe('normalize()', () => {
		it('populates missing fields with sensible defaults', () => {
			const header = UstarHeader.seeded();
			expect(header).not.toBeFalsy();
			expect(header.bytes.length).toBe(Constants.HEADER_SIZE);
			expect(header.fileMode).toBe(Constants.FILE_MODE_DEFAULT);
			expect(header.typeFlag).toBe(UstarHeaderLinkIndicatorType.NORMAL_FILE);
		});

		it('consistently encodes and decodes the same header buffer', () => {
			const header1 = UstarHeader.from({
				fileName: 'Test File.txt',
				fileSize: 50000,
				fileMode: 450
			});
	
			const headerBuffer1 = UstarHeader.serialize(header1);
			expect(TarUtility.isUint8Array(headerBuffer1)).toBe(true);
			expect(headerBuffer1.byteLength).toBe(Constants.HEADER_SIZE);
	
			const header2 = new UstarHeader(headerBuffer1);
			const headerBuffer2 = header2.toUint8Array();
			expect(headerBuffer2).toEqual(headerBuffer1);
	
			// We should be able to serialize and deserialize the same header multiple times without any data loss.
			const header3 = new UstarHeader(headerBuffer2);
			expect(header3.fileName).toBe(header1.fileName);
			expect(header3.fileSize).toBe(header1.fileSize);
			expect(header3.fileMode).toBe(header1.fileMode);
		});
	});

	describe('findNextUstarSectorOffset()', () => {
		it('returns the offset of the next header sector', () => {
			const testHeaderBuffer = UstarHeader.serialize(null as any);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer)).toBe(0);
		});

		it('returns -1 when there is no ustar sector in the given scope', () => {
			expect(TarHeaderUtility.findNextUstarSectorOffset(null as any)).toBe(-1);
		});

		it('uses the given offset when it is provided', () => {
			const padLength = Constants.SECTOR_SIZE * 2;
			const paddingBuffer = new Uint8Array(padLength);
			const testHeaderBuffer = UstarHeader.serialize(null as any);
			const combinedBuffer = TarUtility.concatUint8Arrays(paddingBuffer, testHeaderBuffer);

			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer)).toBe(padLength);
			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer, padLength)).toBe(padLength);
			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer, combinedBuffer.byteLength - 10)).toBe(-1);
		});

		it('snaps negative offsets to zero', () => {
			const testHeaderBuffer = UstarHeader.serialize(null as any);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer, -1)).toBe(0);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer, -123456)).toBe(0);
		});
	});

	describe('isPaxHeader()', () => {
		it('should return true if the indicator is global extended type', () => {
			const header = UstarHeader.from({typeFlag: UstarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER});
			expect(header.isPaxHeader).toBe(true);
			expect(header.isGlobalPaxHeader).toBe(true);
			expect(header.isLocalPaxHeader).toBe(false);
		});

		it('should return true if the indicator is local extended type', () => {
			const header = UstarHeader.from({typeFlag: UstarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER});
			expect(header.isPaxHeader).toBe(true);
			expect(header.isGlobalPaxHeader).toBe(false);
			expect(header.isLocalPaxHeader).toBe(true);
		});

		it('should return false if the indicator is not a pax header type', () => {
			const header = UstarHeader.from({typeFlag: UstarHeaderLinkIndicatorType.NORMAL_FILE});
			expect(header.isPaxHeader).toBe(false);
			expect(header.isGlobalPaxHeader).toBe(false);
			expect(header.isLocalPaxHeader).toBe(false);
		});
	});

	describe('field setters', () => {
		it('should overwrite the field value for the header', () => {
			const header = UstarHeader.seeded();

			header.fileName = 'potato.txt';
			expect(header.fileName).toBe('potato.txt');

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
