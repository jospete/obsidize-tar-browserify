import { Tarball, TarEntry } from '../src';

import { tarballSampleBase64, fileStructures } from './generated/tarball-test-assets';
import { base64ToUint8Array } from './util';

describe('General Usage', () => {

	it('can parse tarballs created by the node-tar module', async () => {

		const tarballUint8 = base64ToUint8Array(tarballSampleBase64);
		const tarball = new Tarball(tarballUint8);
		const foundFiles = new Set<TarEntry>();
		const files = tarball.readAllEntries().filter(entry => entry.isFile());
		const fileNames = files.map(f => f.fileName);
		const fileSet = new Set(files);
		const fileNamesDump = JSON.stringify(fileNames, null, '\t');

		for (const subStructure of fileStructures) {
			for (const path of subStructure) {

				const target = files.find(f => f.fileName.endsWith(path) && fileSet.has(f));

				if (!target) {
					fail(`path "${path}" not found in files: ${fileNamesDump}`);
					continue;
				}

				// Force an assertion error so we know which path failed
				if (foundFiles.has(target)) {
					fail(`found duplicate target "${path}" not found in files: ${fileNamesDump}`);
					continue;
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