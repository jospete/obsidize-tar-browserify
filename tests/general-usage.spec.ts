import { Tarball, TarEntry, TarUtility } from '../src';

import { tarballSampleBase64, fileStructures } from './generated/tarball-test-assets';
import { base64ToUint8Array } from './util';

describe('General Usage', () => {

	it('can parse tarballs created by the node-tar module', async () => {

		const tarballUint8 = base64ToUint8Array(tarballSampleBase64);
		console.log('tarballUint8 length = ' + tarballUint8.byteLength);
		console.log('tarballUint8 isUint8Array = ' + TarUtility.isUint8Array(tarballUint8));

		const tarball = new Tarball(tarballUint8);
		console.log('processing tarball: ', tarball.toJSON());

		const foundFiles = new Set<TarEntry>();
		const files = tarball.readAllEntries().filter(entry => entry.isFile());
		const fileNames = files.map(f => f.fileName);
		const fileSet = new Set(files);
		const fileNamesDump = JSON.stringify(fileNames, null, '\t');

		for (const subStructure of fileStructures) {
			for (const path of subStructure) {

				const target = files.find(f => f.fileName.endsWith(path) && fileSet.has(f));

				if (!target) {
					throw new Error(`path "${path}" not found in files: ${fileNamesDump}`);
				}

				// Force an assertion error so we know which path failed
				if (foundFiles.has(target)) {
					throw new Error(`found duplicate target "${path}" not found in files: ${fileNamesDump}`);
				}

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