import { AsyncUint8Array, TarEntry, TarHeaderLinkIndicatorType, TarHeaderUtility, TarUtility } from '../../src';

import { range } from '../util';

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
		expect(entry.fileSize = 1).toBe(entry.fileSize);
		expect(entry.ownerUserId = 1).toBe(entry.ownerUserId);
		expect(entry.groupUserId = 1).toBe(entry.groupUserId);
		expect(entry.lastModified = 1).toBe(entry.lastModified);

		expect(entry.fileName = 'test').toBe(entry.fileName);
		expect(entry.linkedFileName = 'test').toBe(entry.linkedFileName);
		expect(entry.ustarVersion = 'test').toBe(entry.ustarVersion);
		expect(entry.ownerUserName = 'test').toBe(entry.ownerUserName);
		expect(entry.ownerGroupName = 'test').toBe(entry.ownerGroupName);
		expect(entry.deviceMajorNumber = 'test').toBe(entry.deviceMajorNumber);
		expect(entry.deviceMinorNumber = 'test').toBe(entry.deviceMinorNumber);
		expect(entry.fileNamePrefix = 'test').toBe(entry.fileNamePrefix);

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
	});

	describe('fromAttributes()', () => {

		it('is the inverse of toAttributes()', async () => {

			const entry1 = TarEntry.from({ fileName: 'Test File' }, new Uint8Array(100));
			const attrs = entry1.toAttributes();
			const entry2 = TarEntry.fromAttributes(attrs);

			expect(entry2).toEqual(entry1);
		});
	});

	describe('getHeaderFieldMetadata()', () => {

		it('returns undefined for unknown fields', () => {
			const rawEntry = new TarEntry(null as any);
			expect(rawEntry.getHeaderFieldMetadata('potato' as any)).not.toBeDefined();
		});
	});

	describe('getParsedHeaderFieldValue()', () => {

		it('returns the given default value for unknown fields', () => {
			const rawEntry = new TarEntry(null as any);
			expect(rawEntry.getParsedHeaderFieldValue('potato' as any, 5)).toBe(5);
		});
	});

	describe('setParsedHeaderFieldValue()', () => {

		it('does nothing if the given key is not a valid TarHeader property', () => {
			const rawEntry = new TarEntry(null as any);
			expect(() => rawEntry.setParsedHeaderFieldValue('potato' as any, 5)).not.toThrowError();
		});
	});

	describe('readContentFrom()', () => {

		it('reads the contextualized slice from the given buffer', async () => {

			const testBuffer = new Uint8Array(TarHeaderUtility.HEADER_SIZE + 100);

			for (let i = TarHeaderUtility.HEADER_SIZE, j = 0; i < testBuffer.byteLength; i++, j++)
				testBuffer[i] = j;

			const asyncBuffer: AsyncUint8Array = {
				byteLength: async () => testBuffer.byteLength,
				read: async (offset, length) => testBuffer.slice(offset, offset + length)
			};

			const offset = 12;
			const length = 42;
			const entry = TarEntry.from({ fileName: 'Test File', fileSize: 80 });
			const result = await entry.readContentFrom(asyncBuffer, offset, length);

			expect(TarUtility.isUint8Array(result)).toBe(true);
			expect(result.byteLength).toBe(length);
			expect(result[0]).toBe(offset);
			expect(result[result.byteLength - 1]).toBe(offset + length - 1);
		});

		it('reads the entire file if no offset or length options are given', async () => {

			const testBuffer = new Uint8Array(TarHeaderUtility.HEADER_SIZE + 100);

			for (let i = TarHeaderUtility.HEADER_SIZE, j = 0; i < testBuffer.byteLength; i++, j++)
				testBuffer[i] = j;

			const asyncBuffer: AsyncUint8Array = {
				byteLength: async () => testBuffer.byteLength,
				read: async (offset, length) => testBuffer.slice(offset, offset + length)
			};

			const entry = TarEntry.from({ fileName: 'Test File', fileSize: 80 });
			const result = await entry.readContentFrom(asyncBuffer);

			expect(TarUtility.isUint8Array(result)).toBe(true);
			expect(result.byteLength).toBe(entry.fileSize);
			expect(result[0]).toBe(0);
			expect(result[result.byteLength - 1]).toBe(entry.fileSize - 1);
		});
	});
});