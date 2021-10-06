import { Tarball, TarUtility } from '../src';

describe('README Example', () => {

	it('can be executed', () => {

		// Decode a tarball from some source
		const sourceBuffer = Uint8Array.from([1, 2, 3, 4]);
		const entries = Tarball.extract(sourceBuffer);

		// Create a tarball from some given entry attributes
		const tarballBuffer = Tarball.from([
			{
				header: { fileName: 'Test File.txt' },
				content: TarUtility.encodeString('This is a test file')
			}
		]);
	});
});