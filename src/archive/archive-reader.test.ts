import { InMemoryAsyncUint8Array } from '../common/async-uint8-array';
import { AsyncUint8ArrayIterator } from '../common/async-uint8-array-iterator';
import { ArchiveReader } from './archive-reader';

describe('ArchiveReader', () => {
	it('should be creatable', () => {
		const iterator = new AsyncUint8ArrayIterator(new InMemoryAsyncUint8Array(new Uint8Array()));
		const reader = new ArchiveReader(iterator);
		expect(reader).toBeTruthy();
	});
});
