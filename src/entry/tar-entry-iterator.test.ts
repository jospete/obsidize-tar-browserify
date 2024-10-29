import { TarEntryIterator } from './tar-entry-iterator';

describe('TarEntryIterator', () => {

	it('does not explode when next is called on an uninitialized iterator', () => {
		const iterator = new TarEntryIterator();
		expect(() => iterator.next()).not.toThrow();
		const { value, done } = iterator.next();
		expect(value).toBeFalsy();
		expect(done).toBe(true);
	});

	it('can safely be stringified', () => {
		const iterator = new TarEntryIterator();
		expect(() => JSON.stringify(iterator)).not.toThrowError();
	});
});