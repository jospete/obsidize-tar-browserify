import { TarEntry, TarHeaderLinkIndicatorType } from '../../src';

import { range } from '../util';

describe('TarEntry', () => {

	it('has an option to check if an entry is a directory', () => {
		const directory = TarEntry.from({
			typeFlag: TarHeaderLinkIndicatorType.DIRECTORY
		});
		expect(directory.isDirectory()).toBe(true);
	});

	it('has an option to safely load header values and provide a fallback value if necessary', () => {
		const directory = new TarEntry(null);
		expect(directory.getParsedHeaderFieldValue('fileMode', 1234)).toBe(1234);
	});

	it('can safely be stringified', () => {
		const directory = new TarEntry(null);
		expect(() => JSON.stringify(directory)).not.toThrowError();
		const fileWithContent = TarEntry.from(null, Uint8Array.from(range(100)));
		expect(() => JSON.stringify(fileWithContent)).not.toThrowError();
	});

	describe('tryParse()', () => {

		it('attempts to extract an entry from the given buffer', async () => {
			const originalEntry = TarEntry.from({ fileName: 'Test File' }, new Uint8Array(100));
			const entryBuffer = originalEntry.toUint8Array();
			const reparse = TarEntry.tryParse(entryBuffer);
			expect(originalEntry).toEqual(reparse!);
		});
	});
});