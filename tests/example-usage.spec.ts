import { Tarball, TarUtility } from '../src';

import { tarballSampleBase64, totalFileCount } from './generated/tarball-test-assets';
import { base64ToUint8Array } from './util';

const { isUint8Array } = TarUtility;

describe('Example Usage', () => {

	it('works as advertised', () => {

		// NOTE: You can view the full API here -> https://jospete.github.io/obsidize-tar-browserify/

		// 1. Get some tarball file data
		const tarballUint8 = base64ToUint8Array(tarballSampleBase64);

		// 2. Make a tarball with it
		const tarball = new Tarball(tarballUint8);

		// 3. Get the entries you are interested in (AKA ignore directory entries)
		const entries = tarball.readAllEntries().filter(entry => entry.isFile());

		// 4. Do whatever work you need to with the entries
		expect(entries.length).toBe(totalFileCount);

		for (const entry of entries) {

			console.log(entry.fileName + ' = ', entry.toJSON());

			if (!isUint8Array(entry.content)) {
				fail(`file ${entry.fileName} should have content but it doesn't! -> ${entry.content}`);
			}
		}
	});
});