import { TarEntry, TarHeaderLinkIndicatorType } from '../src';

describe('TarEntry', () => {

	it('has an option to check if an entry is a directory', () => {
		const directory = new TarEntry({ typeFlag: TarHeaderLinkIndicatorType.DIRECTORY } as any);
		expect(directory.isDirectory()).toBe(true);
	});

	it('has an option to safely load header values and provide a fallback value if necessary', () => {
		const directory = new TarEntry(null);
		expect(directory.getHeaderField('fileMode', 1234)).toBe(1234);
	});
});