import { TarEntry, TarHeaderLinkIndicatorType } from '../../src';

import { range } from '../util';

describe('TarEntry', () => {

	it('has an option to check if an entry is a directory', () => {
		const directory = TarEntry.from({ typeFlag: TarHeaderLinkIndicatorType.DIRECTORY });
		expect(directory.isDirectory()).toBe(true);
	});

	it('can safely be stringified', () => {
		const directory = new TarEntry(null);
		expect(() => JSON.stringify(directory)).not.toThrowError();
		const fileWithContent = TarEntry.from(null, Uint8Array.from(range(100)));
		expect(() => JSON.stringify(fileWithContent)).not.toThrowError();
	});

	describe('tryParse()', () => {

		it('attempts to extract an entry from the given buffer', async () => {

			const entry1 = TarEntry.from({ fileName: 'Test File' }, new Uint8Array(100));
			const entryBuffer1 = entry1.toUint8Array();

			const entry2 = TarEntry.tryParse(entryBuffer1);
			const entryBuffer2 = entry2.toUint8Array();

			expect(entry2).toEqual(entry1);
			expect(entryBuffer2).toEqual(entryBuffer1);
		});
	});
});