import { Archive } from '../archive/archive';
import { TarUtility } from '../common/tar-utility';
import { TarEntry } from '../entry/tar-entry';
import {
	fileStructures,
	tarballSampleBase64,
	totalFileCount,
} from './generated/tarball-test-content';
import { base64ToUint8Array } from './test-util';

const { isUint8Array } = TarUtility;

describe('Global Tests', () => {
  describe('Example Usage', () => {
    it('works as advertised', async () => {
      // NOTE: You can view the full API here -> https://jospete.github.io/obsidize-tar-browserify/

      // 1. Get some tarball file data
      const tarballUint8 = base64ToUint8Array(tarballSampleBase64);

      // 2. Get the entries you are interested in (AKA ignore directory entries)
      let entries = await Archive.extract(tarballUint8);
	  entries = entries.filter((e) => e.isFile());

      // 3. Do whatever work you need to with the entries
      expect(entries.length).toBe(totalFileCount);

      for (const entry of entries) {
        if (!isUint8Array(entry.content)) {
          fail(
            `file ${entry.fileName} should have content but it doesn't! -> ${entry.content}`
          );
        }
      }
    });
  });

  describe('General Usage', () => {
    it('can parse tarballs created by the node-tar module', async () => {
      const tarballUint8 = base64ToUint8Array(tarballSampleBase64);
      const foundFiles = new Set<TarEntry>();
	  let files = await Archive.extract(tarballUint8);
	  files = files.filter((e) => e.isFile());

      const fileNames = files.map((f) => f.fileName);
      const fileSet = new Set(files);
      const fileNamesDump = JSON.stringify(fileNames, null, '\t');

      for (const subStructure of fileStructures) {
        for (const path of subStructure) {
          const target = files.find(
            (f) => f.fileName.endsWith(path) && fileSet.has(f)
          );

          if (!target) {
            throw new Error(
              `path "${path}" not found in files: ${fileNamesDump}`
            );
          }

          expect(target).toBeDefined();

          const targetAlreadyFound = foundFiles.has(target);

          // Force an assertion error so we know which path failed
          if (targetAlreadyFound) {
            throw new Error(
              `found duplicate target "${path}" not found in files: ${fileNamesDump}`
            );
          }

          expect(targetAlreadyFound).toBe(false);

          foundFiles.add(target);
          fileSet.delete(target);
        }
      }

      if (fileSet.size > 0) {
        const missingFileNames = Array.from(fileSet).map((f) => f.fileName);
        fail(
          `some files were not accounted for: ${JSON.stringify(
            missingFileNames,
            null,
            '\t'
          )}`
        );
      }
    });
  });

  describe('README Examples', () => {
    describe('simple use case', () => {
      it('can be executed', async () => {
        // Example 1 - Create a tarball in-memory.
        //
        // The Tarball class implements several shorthand methods for
        // injecting content like so:
        const createdTarballBuffer = new Archive()
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
        const entries = await Archive.extract(createdTarballBuffer);
        const [mainFile] = entries;

        expect(mainFile.getContentAsText()).toBe('This is a test file');
      });
    });
  });
});