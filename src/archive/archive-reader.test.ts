import { InMemoryAsyncUint8Array } from '../common/async-uint8-array';
import { AsyncUint8ArrayIterator } from '../common/async-uint8-array-iterator';
import { tarballSampleBase64 } from '../test/generated/pax-header-test-content';
import { base64ToUint8Array } from '../test/test-util';
import { ArchiveReader } from './archive-reader';

describe('ArchiveReader', () => {
	it('should be creatable', () => {
		const iterator = new AsyncUint8ArrayIterator(new InMemoryAsyncUint8Array(new Uint8Array()));
		const reader = new ArchiveReader(iterator);
		expect(reader).toBeTruthy();
	});

	it('should correctly parse pax headers', async () => {
		const buffer = base64ToUint8Array(tarballSampleBase64);
		const entries = await ArchiveReader.readAllEntriesFromMemory(buffer);
		const files = entries.filter(v => v.isFile());
		expect(files.length).toBeGreaterThan(0);
		const paxEntry = entries.find(v => !!v?.header?.pax);
		expect(paxEntry).toBeTruthy();
	});
});
