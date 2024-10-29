import { AsyncUint8Array } from "../common/async-uint8array";
import { TarUtility } from "../common/tar-utility";
import { Tarball } from "../core/tarball";
import { TarEntry } from "../entry/tar-entry";
import {
	fileStructures,
	tarballSampleBase64,
	totalFileCount,
} from "./generated/tarball-test-assets";
import { base64ToUint8Array } from "./test-util";

const { isUint8Array } = TarUtility;

describe("Global Tests", () => {
  describe("Example Usage", () => {
    it("works as advertised", () => {
      // NOTE: You can view the full API here -> https://jospete.github.io/obsidize-tar-browserify/

      // 1. Get some tarball file data
      const tarballUint8 = base64ToUint8Array(tarballSampleBase64);

      // 2. Get the entries you are interested in (AKA ignore directory entries)
      const entries = Tarball.extract(tarballUint8).filter((entry) =>
        entry.isFile()
      );

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

  describe("General Usage", () => {
    it("can parse tarballs created by the node-tar module", async () => {
      const tarballUint8 = base64ToUint8Array(tarballSampleBase64);
      const foundFiles = new Set<TarEntry>();
      const files = Tarball.extract(tarballUint8).filter((entry) =>
        entry.isFile()
      );
      const fileNames = files.map((f) => f.fileName);
      const fileSet = new Set(files);
      const fileNamesDump = JSON.stringify(fileNames, null, "\t");

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
            "\t"
          )}`
        );
      }
    });
  });

  describe("README Examples", () => {
    describe("simple use case", () => {
      it("can be executed", () => {
        // Example 1 - Create a tarball in-memory.
        //
        // The Tarball class implements several shorthand methods for
        // injecting content like so:
        const createdTarballBuffer = new Tarball()
          .addTextFile("Test File.txt", "This is a test file")
          .addBinaryFile("Some binary data.bin", new Uint8Array(10))
          .addDirectory("MyFolder")
          .addTextFile("MyFolder/a nested file.txt", "this is under MyFolder")
          .toUint8Array();

        // Example 2 - Decode a tarball from some Uint8Array source.
        //
        // Here we use the tarball we just created for demonstration purposes,
        // but this could just as easily be a blob from a server, or a local file;
        // as long as the content is a Uint8Array that implements the tar format correctly.
        const entries = Tarball.extract(createdTarballBuffer);
        const [mainFile] = entries;

        expect(mainFile.getContentAsText()).toBe("This is a test file");
      });
    });

    describe("async use case", () => {
      it("can be executed", async () => {
        const mockBuffer = new Tarball()
          .addTextFile("Example.txt", "This is a mock file for async testing")
          .toUint8Array();

        const asyncBuffer: AsyncUint8Array = {
          // fetch tarball file length from storage
          byteLength: async () => mockBuffer.byteLength,

          // read tarball data from storage
          // allows us to read the file in chunks rather than all at once
          read: async (offset: number, length: number) =>
            mockBuffer.slice(offset, offset + length),
        };

        // Option 1 - extractAsync()
        // Preferred for files with few entries
        const entriesFromBigFile = await Tarball.extractAsync(asyncBuffer);

        // IMPORTANT - async entries do not load file content by default to conserve memory.
        // The caller must read file contents from an async entry like so:
        const [firstEntry] = entriesFromBigFile;
        const firstEntryContent = await firstEntry.readContentFrom(asyncBuffer);

        // Option 2 - streamAsync()
        // Preferred for files with many entries
        await Tarball.streamAsync(
          asyncBuffer,
          async (entry, _entryIndex, buffer) => {
            if (entry.isFile()) {
              const content = await entry.readContentFrom(buffer);
              console.log(
                `got file data from ${entry.fileName} (${content.byteLength} bytes)`
              );
              // TODO: do some stuff with the content
            }
          }
        );

        expect(entriesFromBigFile).toBeDefined();
        expect(firstEntryContent).toBeDefined();
      });
    });
  });
});
