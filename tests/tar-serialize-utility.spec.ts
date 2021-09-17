import { Tarball } from '../src';

import { tarballSampleBase64 } from './generated/tarball-test-assets';
import { base64ToUint8Array } from './util';

describe('TarSerializeUtility', () => {

	it('performs the inverse operations of the deserialization utilities', () => {

		const tarUint8 = base64ToUint8Array(tarballSampleBase64);
		const tarball = new Tarball(tarUint8);
		const entries = tarball.readAllEntries();
		const tarUint8_2 = Tarball.from(entries);

		expect(tarUint8_2).toEqual(tarUint8);
	});
});