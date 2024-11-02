import { ArchiveContext } from '../common/archive-context';
import { InMemoryAsyncUint8Array } from '../common/async-uint8-array';
import { AsyncUint8ArrayIterator } from '../common/async-uint8-array-iterator';
import { Constants } from '../common/constants';
import { tarballSampleBase64 as PAX_tarballSampleBase64, totalFileCount as PAX_totalFileCount } from '../test/generated/pax-header-test-content';
import { base64ToUint8Array } from '../test/test-util';
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
		expect(entries.length).toBe(PAX_totalFileCount);
	});
});
