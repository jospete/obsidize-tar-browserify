import { AsyncUint8ArrayIterator } from './async-uint8-array-iterator.ts';
import { InMemoryAsyncUint8Array } from './async-uint8-array.ts';

describe('AsyncUint8ArrayIterator', () => {
	const createFromBuffer = (buffer: Uint8Array = new Uint8Array(0)) => {
		return new AsyncUint8ArrayIterator(new InMemoryAsyncUint8Array(buffer));
	};

	it('should be creatable', () => {
		expect(createFromBuffer()).toBeTruthy();
	});

	it('should have the asyncIterator symbol', () => {
		const iterator = createFromBuffer();
		expect(iterator[Symbol.asyncIterator]()).toBeTruthy();
	});

	it('should have a default offset of zero', () => {
		const iterator = createFromBuffer();
		expect(iterator.currentOffset).toBe(0);
	});

	it('should have a defined byteLength after initialization', async () => {
		const iterator = createFromBuffer(new Uint8Array([1, 2, 3, 4]));
		expect(iterator.byteLength).toBe(4);
	});

	it('should be considered complete when the buffer is empty', async () => {
		const iterator = createFromBuffer();
		expect(iterator.byteLength).toBe(0);
		expect((await iterator.next()).done).toBe(true);
	});
});
