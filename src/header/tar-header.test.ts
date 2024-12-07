import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeader } from '../header/tar-header';
import { TarHeaderField } from '../header/tar-header-field';
import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';
import { PaxTarHeader } from '../pax/pax-tar-header';
import { TarHeaderUtility } from './tar-header-utility';

const {
	concatUint8Arrays,
	isUint8Array,
} = TarUtility;

const {
	findNextUstarSectorOffset
} = TarHeaderUtility;

const {
	FILE_MODE_DEFAULT,
	SECTOR_SIZE,
	HEADER_SIZE
} = Constants;

describe('TarHeader', () => {
	it('can be created with an explicit buffer and offset', () => {
		const blockSize = HEADER_SIZE;
		const offset = blockSize;
		const bufferLength = blockSize * 2;
		const buffer = new Uint8Array(bufferLength);
		const header = new TarHeader(buffer, offset);
		const updatedFileMode = 123;

		expect(header.fileMode).toBe(0);

		header.fileMode = updatedFileMode;
		expect(TarHeaderField.fileMode.readFrom(buffer, offset)).toBe(updatedFileMode);
	});

	it('returns a type flag of UNKNOWN when it fails to retrieve the type flag info', () => {
		const header = new TarHeader(new Uint8Array(10));
		expect(header.typeFlag).toBe(TarHeaderLinkIndicatorType.UNKNOWN);
	});

	describe('from()', () => {
		it('returns the input value as-is if it is already a TarHeader instance', () => {
			const header = new TarHeader();
			const parsedHeader = TarHeader.from(header);
			expect(parsedHeader).toBe(header);
		});
	});

	describe('initialize()', () => {
		it('applies default values if no custom object is given', () => {
			const header = new TarHeader();

			expect(header.deviceMajorNumber).toBe('');
			expect(header.fileMode).toBe(0);

			header.initialize();

			expect(header.deviceMajorNumber).toBe('00');
			expect(header.fileMode).toBe(Constants.FILE_MODE_DEFAULT);
		});

		it('applies default options if the options parameter is falsy', () => {
			const header = new TarHeader();

			expect(header.deviceMajorNumber).toBe('');
			expect(header.fileMode).toBe(0);

			header.initialize({}, null);

			expect(header.deviceMajorNumber).toBe('00');
			expect(header.fileMode).toBe(Constants.FILE_MODE_DEFAULT);
		});

		it('applies a combination of default values and custom ones if a custom object is given', () => {
			const header = new TarHeader();
			const fileName = 'test file.txt';

			expect(header.fileName).toBe('');
			expect(header.fileMode).toBe(0);

			header.initialize({fileName});

			expect(header.fileName).toBe(fileName);
			expect(header.fileMode).toBe(Constants.FILE_MODE_DEFAULT);
		});
	});

	describe('update()', () => {
		it('applies given values to the backing buffer', () => {
			const fileMode = 511;
			const header = new TarHeader();

			header.update({fileMode});
			const bufferText = TarUtility.decodeString(TarHeaderField.fileMode.slice(header.bytes));

			expect(header.fileMode).toBe(fileMode);
			expect(bufferText).toBe('000777 \0');
		});

		it('does nothing if the given attributes are malformed', () => {
			const header = new TarHeader();
			jest.spyOn(header, 'normalize');

			header.update(null as any);
			expect(header.normalize).not.toHaveBeenCalled();

			header.update({});
			expect(header.normalize).not.toHaveBeenCalled();

			header.update({fileMode: 123});
			expect(header.normalize).toHaveBeenCalledTimes(1);
		});
	});

	describe('normalize()', () => {
		it('populates missing fields with sensible defaults', () => {
			const header = TarHeader.seeded();
			expect(header).not.toBeFalsy();
			expect(header.bytes.length).toBe(Constants.HEADER_SIZE);
			expect(header.fileMode).toBe(FILE_MODE_DEFAULT);
			expect(header.typeFlag).toBe(TarHeaderLinkIndicatorType.NORMAL_FILE);
		});

		it('consistently encodes and decodes the same header buffer', () => {
			const header1 = TarHeader.from({
				fileName: 'Test File.txt',
				fileSize: 50000,
				fileMode: 450
			});
	
			const headerBuffer1 = TarHeader.serialize(header1);
			expect(isUint8Array(headerBuffer1)).toBe(true);
			expect(headerBuffer1.byteLength).toBe(HEADER_SIZE);
	
			const header2 = new TarHeader(headerBuffer1);
			const headerBuffer2 = header2.toUint8Array();
			expect(headerBuffer2).toEqual(headerBuffer1);
	
			// We should be able to serialize and deserialize the same header multiple times without any data loss.
			const header3 = new TarHeader(headerBuffer2);
			expect(header3.fileName).toBe(header1.fileName);
			expect(header3.fileSize).toBe(header1.fileSize);
			expect(header3.fileMode).toBe(header1.fileMode);
		});
	});

	describe('findNextUstarSectorOffset()', () => {
		it('returns the offset of the next header sector', () => {
			const testHeaderBuffer = TarHeader.serialize(null as any);
			expect(findNextUstarSectorOffset(testHeaderBuffer)).toBe(0);
		});

		it('returns -1 when there is no ustar sector in the given scope', () => {
			expect(findNextUstarSectorOffset(null as any)).toBe(-1);
		});

		it('uses the given offset when it is provided', () => {
			const padLength = SECTOR_SIZE * 2;
			const paddingBuffer = new Uint8Array(padLength);
			const testHeaderBuffer = TarHeader.serialize(null as any);
			const combinedBuffer = concatUint8Arrays(paddingBuffer, testHeaderBuffer);

			expect(findNextUstarSectorOffset(combinedBuffer)).toBe(padLength);
			expect(findNextUstarSectorOffset(combinedBuffer, padLength)).toBe(padLength);
			expect(findNextUstarSectorOffset(combinedBuffer, combinedBuffer.byteLength - 10)).toBe(-1);
		});

		it('snaps negative offsets to zero', () => {
			const testHeaderBuffer = TarHeader.serialize(null as any);
			expect(findNextUstarSectorOffset(testHeaderBuffer, -1)).toBe(0);
			expect(findNextUstarSectorOffset(testHeaderBuffer, -123456)).toBe(0);
		});
	});

	describe('isPaxHeader()', () => {
		it('should return true if the indicator is global extended type', () => {
			const header = TarHeader.from({typeFlag: TarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER});
			expect(header.isPaxHeader).toBe(true);
			expect(header.isGlobalPaxHeader).toBe(true);
			expect(header.isLocalPaxHeader).toBe(false);
		});

		it('should return true if the indicator is local extended type', () => {
			const header = TarHeader.from({typeFlag: TarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER});
			expect(header.isPaxHeader).toBe(true);
			expect(header.isGlobalPaxHeader).toBe(false);
			expect(header.isLocalPaxHeader).toBe(true);
		});

		it('should return false if the indicator is not a pax header type', () => {
			const header = TarHeader.from({typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE});
			expect(header.isPaxHeader).toBe(false);
			expect(header.isGlobalPaxHeader).toBe(false);
			expect(header.isLocalPaxHeader).toBe(false);
		});
	});

	describe('field setters', () => {
		it('should overwrite the field value for the header', () => {
			const header = TarHeader.seeded();

			header.ustarFileName = 'potato.txt';
			expect(header.ustarFileName).toBe('potato.txt');

			header.ustarOwnerUserId = 1;
			expect(header.ustarOwnerUserId).toBe(1);

			header.ustarGroupUserId = 2;
			expect(header.ustarGroupUserId).toBe(2);

			header.ustarLinkedFileName = 'another potato.txt';
			expect(header.ustarLinkedFileName).toBe('another potato.txt');

			header.typeFlag = TarHeaderLinkIndicatorType.BLOCK_SPECIAL;
			expect(header.typeFlag).toBe(TarHeaderLinkIndicatorType.BLOCK_SPECIAL);

			header.ustarVersion = '22';
			expect(header.ustarVersion).toBe('22');

			header.ustarOwnerUserName = 'owner';
			expect(header.ustarOwnerUserName).toBe('owner');

			header.ustarOwnerGroupName = 'group';
			expect(header.ustarOwnerGroupName).toBe('group');

			header.deviceMajorNumber = '69';
			expect(header.deviceMajorNumber).toBe('69');

			header.deviceMinorNumber = '420';
			expect(header.deviceMinorNumber).toBe('420');

			header.fileNamePrefix = 'v3_final_this_time_for_sure';
			expect(header.fileNamePrefix).toBe('v3_final_this_time_for_sure');
		});
	});

	describe('PAX fields', () => {
		it('should use the PAX field variant as an override to the USTAR variant when it exists', () => {
			const header = TarHeader.seeded();
			header.pax = new PaxTarHeader({
				uname: 'That one guy',
				uid: '123',
				gname: 'The best group',
				gid: '456',
				size: '69420',
				mtime: '1234.1234',
				linkpath: 'this-way/over-here'
			});

			expect(header.ownerUserId).toBe(123);
			expect(header.groupUserId).toBe(456);
			expect(header.fileSize).toBe(69420);
			expect(header.lastModified).toBe(1234123);
			expect(header.linkedFileName).toBe('this-way/over-here');
			expect(header.ownerUserName).toBe('That one guy');
			expect(header.ownerGroupName).toBe('The best group');
		});
	});

	describe('toUint8Array()', () => {
		const fileName = 'test_tar/repository/assets/._0ea3b7ce6f5bcee9ec14b8ad63692c09e25b3a16fddc29157014efc3c1be927e___72d2f2f5ee29e3e703ebcc5f6d1895081a8d3ff17623fd7dda3a3729cc6bb02e___compsci_01_v1_Advice_for_Unhappy_Programmers_v3_mstr.txt';
		const fileNameTruncated = '._0ea3b7ce6f5bcee9ec14b8ad63692c09e25b3a16fddc29157014efc3c1be927e___72d2f2f5ee29e3e703ebcc5f6d1895\0';
		const header = TarHeader.from({fileName, fileSize: 42, typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE});
		const headerBytes = header.toUint8Array();
		const start = Constants.SECTOR_SIZE * 2;
		const end = start + 100;
		const truncatedNameBytes = headerBytes.slice(start, end);
		const truncatedName = TarUtility.decodeString(truncatedNameBytes);
		expect(truncatedName).toBe(fileNameTruncated);
	});
});
