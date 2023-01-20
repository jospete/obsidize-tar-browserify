import { TarEntryAttributes } from '../../src';

describe('TarEntryAttributes', () => {

	it('defaults the content to null when it is not supplied', () => {
		const value = new TarEntryAttributes({ fileName: 'test' });
		expect(value.content).toBe(null);
	});
});