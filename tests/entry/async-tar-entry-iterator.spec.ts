import { AsyncTarEntryIterator, Tarball } from '../../src';
import { MockAsyncUint8Array } from '../mocks/mock-async-uint8array';

describe('AsyncTarEntryIterator', () => {

	it('completes immediately when not initialized', async () => {
		const iterator = new AsyncTarEntryIterator();
		const result = await iterator.next();
		expect(result.done).toBe(true);
	});

	describe('extractAll()', () => {

		it('does not require an entry callback', async () => {
			const result = await AsyncTarEntryIterator.extractAll(null as any);
			expect(result).toEqual([]);
		});

		it('calls the entry callback when it is given', async () => {

			const tarballBuffer = Tarball.create([
				{ header: { fileName: 'test.txt' }, content: new Uint8Array(10) }
			]);

			const asyncBuffer = new MockAsyncUint8Array(tarballBuffer);
			const nextEntrySpy = jasmine.createSpy('nextEntrySpy');
			const result = await AsyncTarEntryIterator.extractAll(asyncBuffer, nextEntrySpy);

			expect(result.length > 0).toBe(true);
			expect(nextEntrySpy).toHaveBeenCalledTimes(1);
		});
	});
});