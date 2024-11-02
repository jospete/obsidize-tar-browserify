import { ArchiveContext } from '../common/archive-context';
import { AsyncUint8ArrayLike, InMemoryAsyncUint8Array } from '../common/async-uint8-array';
import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarEntry } from '../entry/tar-entry';
import { TarHeader } from '../header/tar-header';
import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';
import { range } from '../test/test-util';

const { HEADER_SIZE } = Constants;
const { isUint8Array } = TarUtility;

describe('TarEntry', () => {
	it('has an option to check if an entry is a directory', () => {
		const directory = TarEntry.from({ typeFlag: TarHeaderLinkIndicatorType.DIRECTORY });
		expect(TarEntry.isTarEntry(directory)).toBe(true);
		expect(directory.isDirectory()).toBe(true);
	});

	it('implements the TarHeader interface with conveinence accessors', () => {
		const entry = new TarEntry();

		expect(entry.ustarIndicator).toBeDefined();
		expect(entry.headerChecksum).toBeDefined();

		expect(entry.fileMode = 1).toBe(entry.fileMode);
		expect(entry.fileSize = 2).toBe(entry.fileSize);
		expect(entry.ownerUserId = 3).toBe(entry.ownerUserId);
		expect(entry.groupUserId = 4).toBe(entry.groupUserId);
		expect(entry.lastModified = TarUtility.getTarTimestamp()).toBe(entry.lastModified);

		expect(entry.fileName = 'file name test').toBe(entry.fileName);
		expect(entry.linkedFileName = 'link name test').toBe(entry.linkedFileName);
		expect(entry.ustarVersion = '42').toBe(entry.ustarVersion);
		expect(entry.ownerUserName = 'test owner user').toBe(entry.ownerUserName);
		expect(entry.ownerGroupName = 'test owner group').toBe(entry.ownerGroupName);
		expect(entry.deviceMajorNumber = '11').toBe(entry.deviceMajorNumber);
		expect(entry.deviceMinorNumber = '22').toBe(entry.deviceMinorNumber);
		expect(entry.fileNamePrefix = 'sample file prefix').toBe(entry.fileNamePrefix);

		expect(entry.typeFlag = TarHeaderLinkIndicatorType.HARD_LINK).toBe(entry.typeFlag);
	});

	describe('toJSON()', () => {
		it('can safely be stringified', () => {
			const rawEntry = new TarEntry();
			expect(() => JSON.stringify(rawEntry)).not.toThrow();
	
			const fileWithContent = TarEntry.from({}, Uint8Array.from(range(100)));
			expect(() => JSON.stringify(fileWithContent)).not.toThrow();
		});

		it('should indicate when an entry is a directory', () => {
			const entry = TarEntry.from({typeFlag: TarHeaderLinkIndicatorType.DIRECTORY}, Uint8Array.from(range(100)));
			expect(entry.toJSON().type).toBe('directory');
		});

		it('should indicate when an entry is not a directory or file', () => {
			const entry = TarEntry.from({typeFlag: TarHeaderLinkIndicatorType.FIFO}, Uint8Array.from(range(100)));
			expect(entry.toJSON().type).toBe('complex');
		});
	});

	describe('readContentFrom()', () => {
		it('reads the contextualized slice from the given buffer', async () => {
			const testBuffer = new Uint8Array(HEADER_SIZE + 100);

			for (let i = HEADER_SIZE, j = 0; i < testBuffer.byteLength; i++, j++)
				testBuffer[i] = j;

			const asyncBuffer: AsyncUint8ArrayLike = {
				byteLength: async () => testBuffer.byteLength,
				read: async (offset, length) => testBuffer.slice(offset, offset + length)
			};

			const offset = 12;
			const length = 42;
			const entry = TarEntry.from({ fileName: 'Test File', fileSize: 80 });
			const result = await entry.readContentFrom(asyncBuffer, offset, length);

			expect(isUint8Array(result)).toBe(true);
			expect(result.byteLength).toBe(length);
			expect(result[0]).toBe(offset);
			expect(result[result.byteLength - 1]).toBe(offset + length - 1);
		});

		it('reads the entire file if no offset or length options are given', async () => {

			const testBuffer = new Uint8Array(HEADER_SIZE + 100);

			for (let i = HEADER_SIZE, j = 0; i < testBuffer.byteLength; i++, j++)
				testBuffer[i] = j;

			const asyncBuffer: AsyncUint8ArrayLike = {
				byteLength: async () => testBuffer.byteLength,
				read: async (offset, length) => testBuffer.slice(offset, offset + length)
			};

			const entry = TarEntry.from({ fileName: 'Test File', fileSize: 80 });
			const result = await entry.readContentFrom(asyncBuffer);

			expect(isUint8Array(result)).toBe(true);
			expect(result.byteLength).toBe(entry.fileSize);
			expect(result[0]).toBe(0);
			expect(result[result.byteLength - 1]).toBe(entry.fileSize - 1);
		});
	});

	describe('writeTo()', () => {
		it('returns false if the entry cannot be written to the given output', () => {
			const entry = TarEntry.from({ fileName: 'Test File', fileSize: 80 });
			expect(entry.writeTo(null as any, 0)).toBe(false);
		});
	});

	describe('toUint8Array()', () => {
		it('works for directories', () => {
			const entry = TarEntry.from({ fileName: 'some-directory', typeFlag: TarHeaderLinkIndicatorType.DIRECTORY });
			const bytes = entry.toUint8Array();
			expect(bytes.byteLength).toBe(Constants.HEADER_SIZE);
		});

		it('should include the content value if the entry is a file and the content exists on the entry instance', () => {
			const entry = TarEntry.from({
				fileName: 'some-directory',
				typeFlag: TarHeaderLinkIndicatorType.DIRECTORY
			}, Uint8Array.from([1, 2, 3, 4]));
			const bytes = entry.toUint8Array();
			expect(entry.sectorByteLength).toBe(Constants.SECTOR_SIZE * 2);
			expect(bytes.byteLength).toBe(entry.sectorByteLength);
		});
	});

	describe('bufferEndIndex', () => {
		it('should be the absolute position in the underlying octet stream that this entry was parsed from', () => {
			const entryContent = Uint8Array.from([1, 2, 3, 4]);
			const entryHeader = TarHeader.from({
				fileName: 'some-directory',
				typeFlag: TarHeaderLinkIndicatorType.DIRECTORY
			});
			const entry = new TarEntry({
				header: entryHeader,
				content: entryContent,
				offset: 42
			});
			expect(entry.bufferStartIndex).toBe(42);
			expect(entry.bufferEndIndex).toBe(entry.bufferStartIndex + (Constants.SECTOR_SIZE * 2));
		});
	});

	describe('context', () => {
		it('should be the context interface provided to the constructor', () => {
			const context: ArchiveContext = {
				source: new InMemoryAsyncUint8Array(new Uint8Array(0)),
				globalPaxHeaders: []
			};
			const entry = new TarEntry({ context });
			expect(entry.context).toBe(context);
		});
	});
});
