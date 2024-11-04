import { ArchiveContext } from '../common/archive-context';
import { InMemoryAsyncUint8Array } from '../common/async-uint8-array';
import { AsyncUint8ArrayIterator } from '../common/async-uint8-array-iterator';
import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeader } from '../header/tar-header';
import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';
import { tarballSampleBase64 as PAX_tarballSampleBase64, totalFileCount as PAX_totalFileCount } from '../test/generated/pax-header-test-content';
import { base64ToUint8Array, range } from '../test/test-util';
import { ArchiveReader } from './archive-reader';

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
		const entries = await ArchiveReader.readAllEntriesFromMemory(buffer);
		const files = entries.filter(v => v.isFile());
		expect(files.length).toBeGreaterThan(0);
		const paxEntry = entries.find(v => !!v?.header?.pax);
		expect(paxEntry).toBeTruthy();
	});

	it('should be able to parse from buffer sources with a small chunk size', async () => {
		const buffer = base64ToUint8Array(PAX_tarballSampleBase64);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource, {blockSize: Constants.SECTOR_SIZE});
		const reader = new ArchiveReader(iterator);
		const entries = await reader.readAllEntries();
		const files = entries.filter(v => v.isFile());
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

	it('should skip single entries that do not adhere to the tar format', async () => {
		const contentLength = Constants.SECTOR_SIZE + 1;
		const content = Uint8Array.from(range(contentLength));

		const header = TarHeader.from({
			fileName: 'truncated.bin',
			typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE,
			fileSize: contentLength
		}).toUint8Array();

		const buffer = TarUtility.concatUint8Arrays(header, content);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);

		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);

		const entries = await reader.readAllEntries();
		expect(entries.length).toBe(0);
	});

	it('should skip reading the content buffer for non-in-memory entries', async () => {
		const contentLength = Constants.SECTOR_SIZE;
		const content = Uint8Array.from(range(contentLength));

		const header = TarHeader.from({
			fileName: 'truncated.bin',
			typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE,
			fileSize: contentLength
		}).toUint8Array();

		const buffer = TarUtility.concatUint8Arrays(header, content);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);

		const iterator = new AsyncUint8ArrayIterator({
			byteLength: () => bufferSource.byteLength(),
			read: (offset, length) => bufferSource.read(offset, length)
		});

		const reader = new ArchiveReader(iterator);
		const entries = await reader.readAllEntries();

		expect(entries.length).toBe(1);
		expect(entries[0].content).toBe(null);
	});
});
