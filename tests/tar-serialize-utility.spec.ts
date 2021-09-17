import { Tarball, TarUtility } from '../src';

import { tarballSampleBase64 } from './generated/tarball-test-assets';
import { base64ToUint8Array } from './util';

const { isUint8Array } = TarUtility;

describe('TarSerializeUtility', () => {

	it('performs the inverse operations of the deserialization utilities', () => {

		const tarUint8 = base64ToUint8Array(tarballSampleBase64);

		expect(isUint8Array(tarUint8)).toBe(true);

		const tarball = new Tarball(tarUint8);
		const entries = tarball.readAllEntries();
		const tarUint8_2 = Tarball.from(entries);

		expect(isUint8Array(tarUint8_2)).toBe(true);
		expect(tarUint8.byteLength).toBe(tarUint8_2.byteLength);
		expect(tarUint8_2).toEqual(tarUint8);
	});
});