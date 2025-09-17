import { ArchiveContext } from '../common/archive-context.ts';
import { AsyncUint8ArrayLike, InMemoryAsyncUint8Array } from '../common/async-uint8-array.ts';
import { Constants } from '../common/constants.ts';
import { TarUtility } from '../common/tar-utility.ts';
import { TarHeader } from '../header/tar-header.ts';
import { UstarHeaderLinkIndicatorType } from '../header/ustar/ustar-header-link-indicator-type.ts';
import { range } from '../test/test-util.ts';
import { ArchiveEntry } from './archive-entry.ts';

const { HEADER_SIZE } = Constants;
const { isUint8Array } = TarUtility;

describe('ArchiveEntry', () => {
	it('has an option to check if an entry is a directory', () => {
		const directory = new ArchiveEntry({
			headerAttributes: { typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY },
		});
		expect(ArchiveEntry.isArchiveEntry(directory)).toBe(true);
		expect(directory.isDirectory()).toBe(true);
	});

	it('implements the TarHeader interface with conveinence accessors', () => {
		const header = TarHeader.fromAttributes({
			fileMode: 1,
			fileSize: 2,
			ownerUserId: 3,
			groupUserId: 4,
			lastModified: TarUtility.getUstarTimestamp(),
			fileName: 'file name test',
			linkedFileName: 'link name test',
			ustarVersion: '42',
			ownerUserName: 'test owner user',
			ownerGroupName: 'test owner group',
			deviceMajorNumber: '11',
			deviceMinorNumber: '22',
			fileNamePrefix: 'sample file prefix',
			typeFlag: UstarHeaderLinkIndicatorType.HARD_LINK,
		});

		const entry = new ArchiveEntry({ header });

		expect(entry.ustarIndicator).toBeDefined();
		expect(entry.headerChecksum).toBeDefined();

		expect(entry.fileMode).toBe(1);
		expect(entry.fileSize).toBe(2);
		expect(entry.ownerUserId).toBe(3);
		expect(entry.groupUserId).toBe(4);
		expect(entry.lastModified).toBe(header.lastModified);

		expect(entry.fileName).toBe('file name test');
		expect(entry.linkedFileName).toBe('link name test');
		expect(entry.ustarVersion).toBe('42');
		expect(entry.ownerUserName).toBe('test owner user');
		expect(entry.ownerGroupName).toBe('test owner group');
		expect(entry.deviceMajorNumber).toBe('11');
		expect(entry.deviceMinorNumber).toBe('22');
		expect(entry.fileNamePrefix).toBe('sample file prefix');

		expect(entry.typeFlag).toBe(UstarHeaderLinkIndicatorType.HARD_LINK);
	});

	describe('toJSON()', () => {
		it('can safely be stringified', () => {
			const rawEntry = new ArchiveEntry();
			expect(() => JSON.stringify(rawEntry)).not.toThrow();

			const fileWithContent = new ArchiveEntry({
				content: Uint8Array.from(range(100)),
			});
			expect(() => JSON.stringify(fileWithContent)).not.toThrow();
		});

		it('should indicate when an entry is a directory', () => {
			const entry = new ArchiveEntry({
				headerAttributes: { typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY },
				content: Uint8Array.from(range(100)),
			});
			expect(entry.toJSON().type).toBe('directory');
		});

		it('should indicate when an entry is not a directory or file', () => {
			const entry = new ArchiveEntry({
				headerAttributes: { typeFlag: UstarHeaderLinkIndicatorType.FIFO },
				content: Uint8Array.from(range(100)),
			});
			expect(entry.toJSON().type).toBe('complex');
		});
	});

	describe('readContentFrom()', () => {
		it('reads the contextualized slice from the given buffer', async () => {
			const testBuffer = new Uint8Array(HEADER_SIZE + 100);

			for (let i = HEADER_SIZE, j = 0; i < testBuffer.byteLength; i++, j++) testBuffer[i] = j;

			const asyncBuffer: AsyncUint8ArrayLike = {
				byteLength: testBuffer.byteLength,
				read: async (offset, length) => testBuffer.slice(offset, offset + length),
			};

			const offset = 12;
			const length = 42;
			const entry = new ArchiveEntry({
				headerAttributes: { fileName: 'Test File', fileSize: 80 },
				headerByteLength: HEADER_SIZE,
			});
			const result = await entry.readContentFrom(asyncBuffer, offset, length);

			expect(isUint8Array(result)).toBe(true);
			expect(result.byteLength).toBe(length);
			expect(result[0]).toBe(offset);
			expect(result[result.byteLength - 1]).toBe(offset + length - 1);
		});

		it('reads the entire file if no offset or length options are given', async () => {
			const testBuffer = new Uint8Array(HEADER_SIZE + 100);

			for (let i = HEADER_SIZE, j = 0; i < testBuffer.byteLength; i++, j++) testBuffer[i] = j;

			const asyncBuffer: AsyncUint8ArrayLike = {
				byteLength: testBuffer.byteLength,
				read: async (offset, length) => testBuffer.slice(offset, offset + length),
			};

			const entry = new ArchiveEntry({
				headerAttributes: { fileName: 'Test File', fileSize: 80 },
				headerByteLength: HEADER_SIZE,
			});
			const result = await entry.readContentFrom(asyncBuffer);

			expect(isUint8Array(result)).toBe(true);
			expect(result.byteLength).toBe(entry.fileSize);
			expect(result[0]).toBe(0);
			expect(result[result.byteLength - 1]).toBe(entry.fileSize - 1);
		});
	});

	describe('toUint8Array()', () => {
		it('works for directories', () => {
			const entry = new ArchiveEntry({
				headerAttributes: {
					fileName: 'some-directory',
					typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY,
				},
			});
			const bytes = entry.toUint8Array();
			expect(bytes.byteLength).toBe(Constants.HEADER_SIZE);
		});

		it('should include the content value if the entry is a file and the content exists on the entry instance', () => {
			const entry = new ArchiveEntry({
				headerAttributes: {
					fileName: 'some-directory',
					typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY,
				},
				content: Uint8Array.from([1, 2, 3, 4]),
			});
			const bytes = entry.toUint8Array();
			expect(bytes.byteLength).toBe(Constants.SECTOR_SIZE * 2);
		});
	});

	describe('sourceContext', () => {
		it('should be the context interface provided to the constructor', () => {
			const context: ArchiveContext = {
				source: new InMemoryAsyncUint8Array(new Uint8Array(0)),
				globalPaxHeaders: [],
			};
			const entry = new ArchiveEntry({ context });
			expect(entry.sourceContext).toBe(context);
		});
	});
});
