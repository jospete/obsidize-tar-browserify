import { AsyncUint8Array, Tarball } from '../src';

describe('README Example', () => {

	describe('simple use case', () => {

		it('can be executed', () => {

			// or with runkit:
			// const { Tarball } = require('@obsidize/tar-browserify');

			// Example 1 - Create a tarball from some given entry attributes.
			//
			// The Tarball class implements several shorthand methods for
			// injecting content like so:
			const createdTarball = new Tarball()
				.addTextFile('Test File.txt', 'This is a test file')
				.addBinaryFile('Some binary data.bin', new Uint8Array(10))
				.addDirectory('MyFolder')
				.addTextFile('MyFolder/a nested file.txt', 'this is under MyFolder')
				.toUint8Array();

			// Example 2 - Decode a tarball from some Uint8Array source.
			//
			// Here we use the tarball we just created for demonstration purposes, 
			// but this could just as easily be a blob from a server, or a local file;
			// as long as the content is a Uint8Array that implements the tar format correctly.
			const entries = Tarball.extract(createdTarball);
			const [mainFile] = entries;

			expect(mainFile.getContentAsText()).toBe('This is a test file');
		});
	});

	describe('async use case', () => {

		it('can be executed', async () => {

			const mockBuffer = new Tarball()
				.addTextFile('Example.txt', 'This is a mock file for async testing')
				.toUint8Array();

			const asyncBuffer: AsyncUint8Array = {

				// fetch tarball file length from storage
				byteLength: async () => mockBuffer.byteLength,

				// read tarball data from storage
				// allows us to read the file in chunks rather than all at once
				read: async (offset: number, length: number) => mockBuffer.slice(offset, offset + length)
			};

			// To unpack large files, use extractAsync() to conserve memory
			const entriesFromBigFile = await Tarball.extractAsync(asyncBuffer);

			// IMPORTANT - async entries do not load file content by default to conserve memory.
			// The caller must read file contents from an async entry like so:
			const [firstEntry] = entriesFromBigFile;
			const firstEntryContent = await firstEntry.readContentFrom(asyncBuffer);

			expect(entriesFromBigFile).toBeDefined();
			expect(firstEntryContent).toBeDefined();
		});
	});
});