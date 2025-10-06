import { gzip } from 'pako';
import { Archive, ArchiveEntry, AsyncUint8ArrayLike, Constants, TarUtility } from './index.ts';
import { fileStructures, tarballSampleBase64, totalFileCount } from './test/generated/tarball-test-content.ts';

import {
	fileStructures as PAX_fileStructures,
	tarballSampleBase64 as PAX_tarballSampleBase64,
} from './test/generated/pax-header-test-content.ts';
import { base64ToUint8Array } from './test/test-util.ts';

const { isUint8Array } = TarUtility;

const testGeneratedContent = async (base64Str: string, expectedStructures: string[][]) => {
	const tarballUint8 = base64ToUint8Array(base64Str);
	const foundFiles = new Set<ArchiveEntry>();
	let { entries: files } = await Archive.extract(tarballUint8);
	files = files.filter((e) => e.isFile());

	const fileNames = files.map((f) => f.fileName);
	const fileSet = new Set(files);
	const fileNamesDump = JSON.stringify(fileNames, null, '\t');

	for (const subStructure of expectedStructures) {
		for (const path of subStructure) {
			const target = files.find((f) => f.fileName.endsWith(path) && fileSet.has(f));

			if (!target) {
				throw new Error(`path "${path}" not found in files: ${fileNamesDump}`);
			}

			expect(target).toBeDefined();

			const targetAlreadyFound = foundFiles.has(target);

			// Force an assertion error so we know which path failed
			if (targetAlreadyFound) {
				throw new Error(`found duplicate target "${path}" not found in files: ${fileNamesDump}`);
			}

			expect(targetAlreadyFound).toBe(false);

			foundFiles.add(target);
			fileSet.delete(target);
		}
	}

	if (fileSet.size > 0) {
		const missingFileNames = Array.from(fileSet).map((f) => f.fileName);
		throw new Error(`some files were not accounted for: ${JSON.stringify(missingFileNames, null, '\t')}`);
	}
};

describe('Global Tests', () => {
	describe('Example Usage', () => {
		it('works as advertised', async () => {
			// NOTE: You can view the full API here -> https://jospete.github.io/obsidize-tar-browserify/

			// 1. Get some tarball file data
			const tarballUint8 = base64ToUint8Array(tarballSampleBase64);

			// 2. Get the entries you are interested in (AKA ignore directory entries)
			let { entries } = await Archive.extract(tarballUint8);
			entries = entries.filter((e) => e.isFile());

			// 3. Do whatever work you need to with the entries
			expect(entries.length).toBe(totalFileCount);

			for (const entry of entries) {
				if (!isUint8Array(entry.content)) {
					fail(`file ${entry.fileName} should have content but it doesn't! -> ${entry.content}`);
				}
			}
		});
	});

	describe('General Usage', () => {
		it('can parse tarballs created by the node-tar module', async () => {
			await testGeneratedContent(tarballSampleBase64, fileStructures);
		});

		it('should be able to parse pax headers', async () => {
			await testGeneratedContent(PAX_tarballSampleBase64, PAX_fileStructures);
		});
	});

	describe('README Examples', () => {
		describe('simple use case', () => {
			it('should be runnable', async () => {
				// Example 1 - Create an archive in-memory.
				const createdTarballBuffer = new Archive()
					.addTextFile('Test File.txt', 'This is a test file')
					.addBinaryFile('Some binary data.bin', new Uint8Array(10))
					.addDirectory('MyFolder')
					.addTextFile('MyFolder/a nested file.txt', 'this is under MyFolder')
					.toUint8Array();

				// Example 2 - Decode an archive from some Uint8Array source in-memory.
				const { entries } = await Archive.extract(createdTarballBuffer);
				const [firstFile] = entries;

				expect(firstFile.fileName).toBe('Test File.txt');
				expect(TarUtility.isUint8Array(firstFile.content)).toBe(true);
				expect(firstFile.text()).toBe('This is a test file');

				// Example 3 - Iterate over an archive source as a stream
				for await (const entry of Archive.read(createdTarballBuffer)) {
					// do some stuff with the entry...
				}
			});
		});

		describe('advanced iteration', () => {
			it('should be runnable', async () => {
				const createdTarballBuffer = new Archive()
					.addTextFile('Test File.txt', 'This is a test file')
					.toUint8Array();

				const entries: ArchiveEntry[] = [];
				for await (const entry of Archive.read(createdTarballBuffer)) {
					entries.push(entry);
				}

				expect(entries.length).toBe(1);
				expect(entries[0].text()).toBe('This is a test file');
			});
		});

		describe('v6 read example', () => {
			it('should be runnable', async () => {
				const tarBuffer = base64ToUint8Array(tarballSampleBase64);

				for await (const entry of Archive.read(tarBuffer)) {
					if (entry.isFile()) {
						expect(entry.fileName).toBeTruthy();
						expect(entry.content).toBeTruthy();
						expect(entry.text()).toBeTruthy();
					}
				}
			});
		});

		describe('v6 write example', () => {
			it('should be runnable', async () => {
				const tarBuffer = new Archive()
					.addDirectory('MyStuff')
					.addTextFile('MyStuff/todo.txt', 'This is my TODO list')
					.addBinaryFile('MyStuff/some-raw-file.obj', Uint8Array.from([1, 2, 3, 4, 5]))
					.addDirectory('Nested1')
					.addDirectory('Nested1/Nested2')
					.addBinaryFile('Nested1/Nested2/supersecret.bin', Uint8Array.from([6, 7, 8, 9]))
					.toUint8Array();

				const gzBuffer = gzip(tarBuffer) as BlobPart;
				const fileToSend = new File([gzBuffer], 'my-awesome-new-file.tar.gz');
				expect(fileToSend).toBeTruthy();
			});
		});

		describe('v6 modify example', () => {
			it('should be runnable', async () => {
				const tarBuffer = base64ToUint8Array(tarballSampleBase64);
				const archive = await Archive.extract(tarBuffer);

				const updatedTarBuffer = archive
					.removeEntriesWhere((entry) => /unwanted\-file\-name\.txt/.test(entry.fileName))
					.cleanAllHeaders() // remove unwanted metadata
					.addTextFile('new text file.txt', 'this was added to the original tar file!')
					.toUint8Array();

				const updatedGzBuffer = gzip(updatedTarBuffer) as BlobPart;
				const fileToSend = new File([updatedGzBuffer], 'my-awesome-edited-file.tar.gz');
				expect(fileToSend).toBeTruthy();
			});
		});

		describe('v6 big read example', () => {
			it('should be runnable', async () => {
				const tarBuffer = base64ToUint8Array(tarballSampleBase64);
				const customAsyncBuffer: AsyncUint8ArrayLike = {
					byteLength: tarBuffer.length,
					read: async (offset: number, length: number): Promise<Uint8Array> =>
						tarBuffer.slice(offset, offset + length),
				};

				for await (const entry of Archive.read(customAsyncBuffer)) {
					if (!entry.isFile()) {
						continue;
					}

					let offset = 0; // offset into this entry's file content
					let chunkSize = 1024; // read 1Kb at a time

					while (offset < entry.fileSize) {
						const fileChunk = await entry.readContentFrom(customAsyncBuffer, offset, chunkSize);
						offset += fileChunk.byteLength;
						expect(fileChunk).toBeTruthy();
					}
				}
			});
		});

		describe('v6.2 big read example', () => {
			it('should be runnable', async () => {
				const tarBuffer = base64ToUint8Array(tarballSampleBase64);
				const customAsyncBuffer: AsyncUint8ArrayLike = {
					byteLength: tarBuffer.length,
					read: async (offset: number, length: number): Promise<Uint8Array> =>
						tarBuffer.slice(offset, offset + length),
				};

				for await (const entry of Archive.read(customAsyncBuffer, { blockSize: Constants.SECTOR_SIZE })) {
					if (!entry.isFile() || !entry.fileName.endsWith('package.json')) {
						continue;
					}

					let chunk = await entry.readNextContentChunk();
					let lastBuf: Uint8Array | null = null;
					let chunkCount = 0;
					let totalBytes = 0;

					while (chunk) {
						lastBuf = chunk;
						chunkCount += 1;
						totalBytes += chunk.byteLength;
						chunk = await entry.readNextContentChunk();
						expect(lastBuf).not.toEqual(chunk);
					}

					expect(chunkCount).toBe(7);
					expect(totalBytes).toBe(entry.fileSize);
					expect(entry.fileSize).toBe(2888);
					expect(entry.fileSize % Constants.SECTOR_SIZE).not.toBe(0);

					break;
				}
			});
		});
	});
});
