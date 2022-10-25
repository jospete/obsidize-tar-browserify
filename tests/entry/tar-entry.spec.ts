import { TarEntry, TarHeaderLinkIndicatorType } from '../../src';

import { range } from '../util';

describe('TarEntry', () => {

	it('has an option to check if an entry is a directory', () => {
		const directory = TarEntry.from({ typeFlag: TarHeaderLinkIndicatorType.DIRECTORY });
		expect(TarEntry.isTarEntry(directory)).toBe(true);
		expect(directory.isDirectory()).toBe(true);
	});

	it('can safely be stringified', () => {

		const rawEntry = new TarEntry(null as any);
		expect(() => JSON.stringify(rawEntry)).not.toThrowError();

		const fileWithContent = TarEntry.from(null as any, Uint8Array.from(range(100)));
		expect(() => JSON.stringify(fileWithContent)).not.toThrowError();
	});

	describe('tryParse()', () => {

		it('attempts to extract an entry from the given buffer', async () => {

			const entry1 = TarEntry.from({ fileName: 'Test File' }, new Uint8Array(100));
			const entryBuffer1 = entry1.toUint8Array();

			const entry2 = TarEntry.tryParse(entryBuffer1);
			const entryBuffer2 = entry2!.toUint8Array();

			expect(entry2).toEqual(entry1);
			expect(entryBuffer2).toEqual(entryBuffer1);
		});
	});

	describe('fromAttributes()', () => {

		it('is the inverse of toAttributes()', async () => {

			const entry1 = TarEntry.from({ fileName: 'Test File' }, new Uint8Array(100));
			const attrs = entry1.toAttributes();
			const entry2 = TarEntry.fromAttributes(attrs);

			expect(entry2).toEqual(entry1);
		});
	});

	describe('getHeaderFieldMetadata()', () => {

		it('returns undefined for unknown fields', () => {
			const rawEntry = new TarEntry(null as any);
			expect(rawEntry.getHeaderFieldMetadata('potato' as any)).not.toBeDefined();
		});
	});

	describe('getParsedHeaderFieldValue()', () => {

		it('returns the given default value for unknown fields', () => {
			const rawEntry = new TarEntry(null as any);
			expect(rawEntry.getParsedHeaderFieldValue('potato' as any, 5)).toBe(5);
		});
	});
});