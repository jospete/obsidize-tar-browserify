import { Tarball, TarUtility } from '../src';

describe('README Example', () => {

	it('can be executed', async () => {

		// Decode a tarball from some source
		const sourceBuffer = Uint8Array.from([1, 2, 3, 4]);
		const entries = Tarball.extract(sourceBuffer);

		expect(entries).toBeDefined();

		// Create a tarball from some given entry attributes
		const tarballBuffer = Tarball.create([
			{
				header: { fileName: 'Test File.txt' },
				content: TarUtility.encodeString('This is a test file')
			}
		]);

		expect(tarballBuffer).toBeDefined();

		const mockBuffer = new Uint8Array(42);

		// To unpack large files, use extractAsync() to conserve memory
		const asyncEntries = await Tarball.extractAsync({

			// fetch tarball file length from storage
			byteLength: () => Promise.resolve(mockBuffer.byteLength),

			// read tarball data from storage
			// allows us to read the file in chunks rather than all at once
			read: (offset: number, length: number) => Promise.resolve(mockBuffer.slice(offset, length))
		});

		expect(asyncEntries).toBeDefined();
	});
});