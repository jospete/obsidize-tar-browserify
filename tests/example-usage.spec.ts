import { Tarball, TarEntry } from '../src';

import { tarballSampleBase64, fileStructures } from './generated/tarball-test-assets';
import { base64ToUint8Array } from './util';

describe('Example Usage', () => {

	it('works as advertised', async () => {

		const tarballUint8 = base64ToUint8Array(tarballSampleBase64);
		const tarball = new Tarball(tarballUint8);
		const files = tarball.readAllEntries();
		const foundFiles = new Set<TarEntry>();

		for (const subStructure of fileStructures) {
			for (const path of subStructure) {

				const target = files.find(f => f.header.fileName.includes(path));

				if (!target || foundFiles.has(target)) {

					// Force an assertion error so we know which path failed
					expect(path).toBe(null);

				} else {
					foundFiles.add(target);
				}
			}
		}

		const missingFiles = [];

		for (const file of files) {
			if (!foundFiles.has(file)) {
				missingFiles.push(file);
			}
		}

		if (missingFiles.length > 0) {

			// Force an assertion error so we can see what files are missing
			expect(missingFiles).toBe(null);
		}
	});
});