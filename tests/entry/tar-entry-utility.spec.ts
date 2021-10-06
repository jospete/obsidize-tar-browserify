import { TarEntryUtility } from '../../src';

const { extractEntryMetadata } = TarEntryUtility;

describe('TarEntryUtility', () => {

	describe('extractEntryMetadata', () => {

		it('returns null when bad input is given', () => {
			expect(extractEntryMetadata(null)).toBe(null);
			expect(extractEntryMetadata({} as any)).toBe(null);
			expect(extractEntryMetadata('testing one two' as any)).toBe(null);
		});
	});

	describe('generateEntryBuffer()', () => {

		it('returns null if the given input is falsy', () => {
			expect(TarEntryUtility.generateEntryBuffer(null)).toBe(null);
			expect(TarEntryUtility.generateEntryBuffer(undefined)).toBe(null);
			expect(TarEntryUtility.generateEntryBuffer(0 as any)).toBe(null);
			expect(TarEntryUtility.generateEntryBuffer({} as any)).not.toBe(null);
		});
	});
});