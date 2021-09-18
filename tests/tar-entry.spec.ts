import { TarEntry, TarHeaderLinkIndicatorType } from '../src';
import { range } from './util';

describe('TarEntry', () => {

	it('has an option to check if an entry is a directory', () => {
		const directory = new TarEntry({ typeFlag: TarHeaderLinkIndicatorType.DIRECTORY } as any);
		expect(directory.isDirectory()).toBe(true);
	});

	it('has an option to safely load header values and provide a fallback value if necessary', () => {
		const directory = new TarEntry(null);
		expect(directory.getHeaderFieldValue('fileMode', 1234)).toBe(1234);
	});

	it('can safely be stringified', () => {
		const directory = new TarEntry(null);
		expect(() => JSON.stringify(directory)).not.toThrowError();
		const fileWithContent = new TarEntry(null, Uint8Array.from(range(100)));
		expect(() => JSON.stringify(fileWithContent)).not.toThrowError();
	});
});