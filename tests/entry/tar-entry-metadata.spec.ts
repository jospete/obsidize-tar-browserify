import { TarEntryMetadata, TarHeader } from '../../src';

describe('TarEntryMetadata', () => {

	describe('from()', () => {

		it('returns the input value if it is already a TarEntryMetadata instance', () => {
			const metadata = new TarEntryMetadata(new TarHeader(), null, 0);
			expect(TarEntryMetadata.from(metadata)).toBe(metadata);
		});

		it('accepts a custom offset', () => {
			const testOffset = 42;
			const metadata = TarEntryMetadata.from({ header: new TarHeader(), offset: testOffset });
			expect(metadata.offset).toBe(testOffset);
		});
	});

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