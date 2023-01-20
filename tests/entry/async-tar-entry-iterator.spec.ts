import { AsyncTarEntryIterator } from '../../src';

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
	});
});