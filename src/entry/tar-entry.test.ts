import { AsyncUint8Array } from '../common/async-uint8array';
import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarEntry } from '../entry/tar-entry';
import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';
import { range } from '../test-util';

const { HEADER_SIZE } = Constants;
const { isUint8Array } = TarUtility;

describe('TarEntry', () => {

	it('has an option to check if an entry is a directory', () => {
		const directory = TarEntry.from({ typeFlag: TarHeaderLinkIndicatorType.DIRECTORY });
		expect(TarEntry.isTarEntry(directory)).toBe(true);
		expect(directory.isDirectory()).toBe(true);
	});

	it('can safely be stringified', () => {

		const rawEntry = new TarEntry(null as any);
		expect(() => JSON.stringify(rawEntry)).not.toThrowError();

		const fileWithContent = TarEntry.from(null as any, Uint8Array.from(range(100)));
		expect(() => JSON.stringify(fileWithContent)).not.toThrowError();
	});

	it('implements the TarHeader interface with conveinence accessors', () => {

		const entry = new TarEntry(null as any);

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

	describe('tryParse()', () => {

		it('attempts to extract an entry from the given buffer', async () => {

			const entry1 = TarEntry.from({ fileName: 'Test File' }, new Uint8Array(100));
			const entryBuffer1 = entry1.toUint8Array();

			const entry2 = TarEntry.tryParse(entryBuffer1);
			const entryBuffer2 = entry2!.toUint8Array();

			expect(entry2).toEqual(entry1);
			expect(entryBuffer2).toEqual(entryBuffer1);
		});

		it('returns null when bad input is given', () => {
			expect(TarEntry.tryParse(null as any)).toBe(null);
			expect(TarEntry.tryParse(undefined as any)).toBe(null);
		});
	});

	describe('tryParseAsync()', () => {

		it('returns null when bad input is given', async () => {
			expect(await TarEntry.tryParseAsync(null as any)).toBe(null);
			expect(await TarEntry.tryParseAsync(undefined as any)).toBe(null);
		});
	});

	describe('readContentFrom()', () => {

		it('reads the contextualized slice from the given buffer', async () => {

			const testBuffer = new Uint8Array(HEADER_SIZE + 100);

			for (let i = HEADER_SIZE, j = 0; i < testBuffer.byteLength; i++, j++)
				testBuffer[i] = j;

			const asyncBuffer: AsyncUint8Array = {
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

			const asyncBuffer: AsyncUint8Array = {
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
	});
});