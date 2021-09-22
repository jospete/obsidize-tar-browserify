import { TarEntryUtility } from '../src';

describe('TarEntryUtility', () => {

	describe('extractEntryMetadata', () => {

		const { extractEntryMetadata } = TarEntryUtility;

		it('returns null when bad input is given', () => {
			expect(extractEntryMetadata(null)).toBe(null);
			expect(extractEntryMetadata({} as any)).toBe(null);
			expect(extractEntryMetadata('testing one two' as any)).toBe(null);
		});
	});
});