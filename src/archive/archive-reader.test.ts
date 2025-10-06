import { ArchiveContext } from '../common/archive-context.ts';
import { AsyncUint8ArrayIterator } from '../common/async-uint8-array-iterator.ts';
import { AsyncUint8ArrayLike, InMemoryAsyncUint8Array } from '../common/async-uint8-array.ts';
import { Constants } from '../common/constants.ts';
import { TarUtility } from '../common/tar-utility.ts';
import { PaxHeaderKey } from '../header/pax/pax-header-key.ts';
import { PaxHeader, PaxHeaderAttributes } from '../header/pax/pax-header.ts';
import { TarHeader } from '../header/tar-header.ts';
import { UstarHeaderLike } from '../header/ustar/ustar-header-like.ts';
import { UstarHeaderLinkIndicatorType } from '../header/ustar/ustar-header-link-indicator-type.ts';
import { UstarHeader } from '../header/ustar/ustar-header.ts';
import {
	tarballSampleBase64 as LongLink_tarballSampleBase64,
} from '../test/generated/long-link-header-test-content.ts';
import {
	tarballSampleBase64 as PAX_tarballSampleBase64,
	totalFileCount as PAX_totalFileCount,
} from '../test/generated/pax-header-test-content.ts';
import { tarballSampleBase64 } from '../test/generated/tarball-test-content.ts';
import { base64ToUint8Array, range } from '../test/test-util.ts';
import { ArchiveEntry } from './archive-entry.ts';
import { ArchiveReader, ArchiveReadError } from './archive-reader.ts';

const createPaxHeaderBuffer = (
	headerAttrs: Partial<UstarHeaderLike>,
	paxAttrs: Partial<PaxHeaderAttributes>,
	global?: boolean,
): Uint8Array => {
	const actualHeader = UstarHeader.fromAttributes(headerAttrs);
	const paxHeader = PaxHeader.fromAttributes(paxAttrs);
	const combinedHeader = new TarHeader({ ustar: actualHeader, pax: paxHeader, isPaxGlobal: global });
	return combinedHeader.toUint8Array();
};

describe('ArchiveReader', () => {
	it('should be creatable', () => {
		const iterator = new AsyncUint8ArrayIterator(new InMemoryAsyncUint8Array(new Uint8Array()));
		const reader = new ArchiveReader(iterator);
		expect(reader).toBeTruthy();
	});

	it('should implement ArchiveContext', () => {
		const bufferSource = new InMemoryAsyncUint8Array(new Uint8Array());
		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const context: ArchiveContext = new ArchiveReader(iterator);
		expect(context.source).toBe(bufferSource);
		expect(context.globalPaxHeaders).toEqual([]);
	});

	it('should correctly parse pax headers', async () => {
		const buffer = base64ToUint8Array(PAX_tarballSampleBase64);
		const entries = await ArchiveReader.withInput(buffer).readAllEntries();
		const files = entries.filter((v) => v.isFile());
		expect(files.length).toBeGreaterThan(0);
		const paxEntry = entries.find((v) => !!v?.header?.pax);
		expect(paxEntry).toBeTruthy();
	});

	it('should correctly parse long-link headers', async () => {
		const buffer = base64ToUint8Array(LongLink_tarballSampleBase64);
		const entries = await ArchiveReader.withInput(buffer).readAllEntries();
		const files = entries.filter((v) => v.isFile());
		expect(files.length).toBeGreaterThan(0);
		const longLinkEntry = entries.find((v) => v?.header?.isLongLinkHeader);
		expect(longLinkEntry).toBeTruthy();
	});

	it('should be able to parse from buffer sources with a small chunk size', async () => {
		const buffer = base64ToUint8Array(PAX_tarballSampleBase64);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource, { blockSize: Constants.SECTOR_SIZE });
		const reader = new ArchiveReader(iterator);
		const entries = await reader.readAllEntries();
		const files = entries.filter((v) => v.isFile());
		expect(files.length).toBe(PAX_totalFileCount);
	});

	it('should bail safely when given a non-tar buffer', async () => {
		const buffer = Uint8Array.from([1, 2, 3, 4]);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);
		const entries = await reader.readAllEntries();
		expect(entries.length).toBe(0);
	});

	it('should blow up on entries that do not adhere to the tar format', async () => {
		const contentLength = Constants.SECTOR_SIZE + 1;
		const content = Uint8Array.from(range(contentLength));

		const header = TarHeader.serializeAttributes({
			fileName: 'truncated.bin',
			typeFlag: UstarHeaderLinkIndicatorType.NORMAL_FILE,
			fileSize: contentLength,
		});

		const buffer = TarUtility.concatUint8Arrays(header, content);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);

		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);

		try {
			await reader.readAllEntries();
			fail('readAllEntries should not succeed for malformed input');
		} catch (e) {
			expect(e).toBe(ArchiveReadError.ERR_ENTRY_CONTENT_MIN_BUFFER_LENGTH_NOT_MET);
		}
	});

	it('should skip reading the content buffer for non-in-memory entries', async () => {
		const contentLength = Constants.SECTOR_SIZE;
		const content = Uint8Array.from(range(contentLength));

		const header = TarHeader.serializeAttributes({
			fileName: 'truncated.bin',
			typeFlag: UstarHeaderLinkIndicatorType.NORMAL_FILE,
			fileSize: contentLength,
		});

		const buffer = TarUtility.concatUint8Arrays(header, content);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);

		const iterator = new AsyncUint8ArrayIterator({
			byteLength: bufferSource.byteLength,
			read: (offset, length) => bufferSource.read(offset, length),
		});

		const reader = new ArchiveReader(iterator);
		const entries = await reader.readAllEntries();

		expect(entries.length).toBe(1);
		expect(entries[0].content).toBe(null);
	});

	it('should append global pax headers to reader context interface array', async () => {
		const headerAttrs: Partial<UstarHeaderLike> = {
			fileName: 'Some Global Garbage',
			typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY,
		};
		const paxAttrs: Partial<PaxHeaderAttributes> = {
			[PaxHeaderKey.PATH]: 'A an extra name override or something',
			[PaxHeaderKey.SIZE]: '0',
		};

		const paxBuffer = createPaxHeaderBuffer(headerAttrs, paxAttrs, true);
		const bufferSource = new InMemoryAsyncUint8Array(paxBuffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);
		const entries = await reader.readAllEntries();

		expect(entries.length).toBe(1);
		expect(reader.globalPaxHeaders.length).toBe(1);
	});

	it('should blow up on malformed global pax header entries', async () => {
		const headerAttrs: Partial<UstarHeaderLike> = {
			fileName: 'Some Global Garbage',
			typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY,
		};
		const paxAttrs: Partial<PaxHeaderAttributes> = {
			fileName: 'A an extra name override or something',
		};

		const paxBuffer = createPaxHeaderBuffer(headerAttrs, paxAttrs, true);
		const corruptedBuffer = paxBuffer.slice(0, paxBuffer.byteLength - Constants.SECTOR_SIZE + 5);
		const bufferSource = new InMemoryAsyncUint8Array(corruptedBuffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);

		try {
			await reader.readAllEntries();
			fail('readAllEntries should not succeed for malformed input');
		} catch (e) {
			expect(e).toBe(ArchiveReadError.ERR_HEADER_PAX_MIN_BUFFER_LENGTH_NOT_MET);
		}
	});

	it('should blow up on malformed local pax header entries', async () => {
		const headerAttrs: Partial<UstarHeaderLike> = {
			fileName: 'Some Local Garbage',
			typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY,
		};
		const paxAttrs: Partial<PaxHeaderAttributes> = {
			fileName: 'A an extra name override or something',
		};

		const paxBuffer = createPaxHeaderBuffer(headerAttrs, paxAttrs);
		paxBuffer.set(range(Constants.HEADER_SIZE), paxBuffer.byteLength - Constants.HEADER_SIZE);

		const bufferSource = new InMemoryAsyncUint8Array(paxBuffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);

		try {
			await reader.readAllEntries();
			fail('readAllEntries should not succeed for malformed input');
		} catch (e) {
			expect(e).toBe(ArchiveReadError.ERR_HEADER_MISSING_POST_PAX_SEGMENT);
		}
	});

	it('should purge the in-memory cache when it goes over the max threshold during header marker searches', async () => {
		const size = Constants.SECTOR_SIZE * 100001;
		const buffer = new Uint8Array(size);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);
		const reader = ArchiveReader.withInput(bufferSource);
		const spy = jest.spyOn<any, any>(reader, 'clearBufferCache');
		await reader.readAllEntries();
		expect(spy).toHaveBeenCalledTimes(3);
	});

	describe('withInput()', () => {
		it('should use async-like structures as is', () => {
			const buffer = Uint8Array.from([1, 2, 3, 4]);
			const bufferSource = new InMemoryAsyncUint8Array(buffer);
			const reader = ArchiveReader.withInput(bufferSource);
			expect(reader.source).toBe(bufferSource);
		});
	});

	describe('tryLoadNextEntryContentChunk()', () => {
		it('should ignore requests from entries that it did not create', async () => {
			const buffer = Uint8Array.from([1, 2, 3, 4]);
			const bufferSource = new InMemoryAsyncUint8Array(buffer);
			const reader = ArchiveReader.withInput(bufferSource);
			const entry = new ArchiveEntry({ context: null });
			const result = await reader.tryLoadNextEntryContentChunk(entry);
			expect(result).toBe(null);
		});

		it('should return null if the reader offset is outside of the content bounds', async () => {
			const tarBuffer = base64ToUint8Array(tarballSampleBase64);
			const customAsyncBuffer: AsyncUint8ArrayLike = {
				byteLength: tarBuffer.length,
				read: async (offset: number, length: number): Promise<Uint8Array> =>
					tarBuffer.slice(offset, offset + length),
			};

			const reader = new ArchiveReader(
				new AsyncUint8ArrayIterator(customAsyncBuffer, { blockSize: Constants.SECTOR_SIZE }),
			);
			const { value: entry1 } = await reader.next();
			await reader.next(); // advance cursor beyond entry 1's content
			const outOfBounds = await reader.tryLoadNextEntryContentChunk(entry1);
			expect(outOfBounds).toBe(null);
		});

		it('should return null if the reader cannot load any more data from the input source', async () => {
			const tarBuffer = base64ToUint8Array(tarballSampleBase64);
			const customAsyncBuffer: AsyncUint8ArrayLike = {
				byteLength: tarBuffer.length,
				read: async (offset: number, length: number): Promise<Uint8Array> =>
					tarBuffer.slice(offset, offset + length),
			};

			const reader = new ArchiveReader(new AsyncUint8ArrayIterator(customAsyncBuffer));
			const { value: entry1 } = await reader.next();
			let drain = await reader.next();

			while (!drain.done) {
				drain = await reader.next();
			}

			const outOfBounds = await reader.tryLoadNextEntryContentChunk(entry1);
			expect(outOfBounds).toBe(null);
		});
	});
});
