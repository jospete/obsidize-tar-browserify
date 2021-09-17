import { TarDeserializeUtility } from '../src';

const { extractTarEntry } = TarDeserializeUtility;

describe('extractTarEntry', () => {

	it('does nothing if an invalid buffer reference is given', () => {
		expect(() => extractTarEntry(null)).not.toThrowError();
		expect(() => extractTarEntry(Uint8Array as any)).not.toThrowError();
		const { entry, nextOffset } = extractTarEntry(null);
		expect(entry).toBe(null);
		expect(nextOffset).toBe(0);
	});

	it('uses the given offset when a positive number is provided', () => {
		const { nextOffset } = extractTarEntry(null, 42);
		expect(nextOffset).toBe(42);
	});

	it('defaults to an offset of zero if a negative offset is given', () => {
		const { nextOffset } = extractTarEntry(new Uint8Array(), -1234);
		expect(nextOffset).toBe(0);
	});
});