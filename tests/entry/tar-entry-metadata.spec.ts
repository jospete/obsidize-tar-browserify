import { TarEntryMetadata } from '../../src';

describe('TarEntryMetadata', () => {

	describe('extractFrom()', () => {

		it('returns null when bad input is given', () => {
			expect(TarEntryMetadata.extractFrom(null as any)).toBe(null);
			expect(TarEntryMetadata.extractFrom({} as any)).toBe(null);
			expect(TarEntryMetadata.extractFrom('testing one two' as any)).toBe(null);
		});
	});

	describe('extractEntryMetadataAsync()', () => {

		it('returns null if the given input is falsy', async () => {
			expect(await TarEntryMetadata.extractFromAsync(null as any)).toBe(null);
			expect(await TarEntryMetadata.extractFromAsync(null as any, 42)).toBe(null);
		});
	});
});