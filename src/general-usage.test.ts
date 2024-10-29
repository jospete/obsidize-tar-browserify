import { TarUtility } from './common/tar-utility';
import { Tarball } from './core/tarball';
import { TarEntry } from './entry/tar-entry';
import { fileStructures, tarballSampleBase64 } from './generated/tarball-test-assets';
import { base64ToUint8Array } from './test-util';

const { isUint8Array } = TarUtility;

describe('General Usage', () => {

	it('can parse tarballs created by the node-tar module', async () => {

		const tarballUint8 = base64ToUint8Array(tarballSampleBase64);
		console.log('tarballUint8 length = ' + tarballUint8.byteLength);
		console.log('tarballUint8 isUint8Array = ' + isUint8Array(tarballUint8));

		const foundFiles = new Set<TarEntry>();
		const files = Tarball.extract(tarballUint8).filter(entry => entry.isFile());
		const fileNames = files.map(f => f.fileName);
		const fileSet = new Set(files);
		const fileNamesDump = JSON.stringify(fileNames, null, '\t');

		for (const subStructure of fileStructures) {
			for (const path of subStructure) {

				const target = files.find(f => f.fileName.endsWith(path) && fileSet.has(f));

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
			const missingFileNames = Array.from(fileSet).map(f => f.fileName);
			fail(`some files were not accounted for: ${JSON.stringify(missingFileNames, null, '\t')}`);
		}
	});
});