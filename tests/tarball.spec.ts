import { Tarball } from '../src';

import { tarballSampleBase64 } from './generated/tarball-test-assets';
import { base64ToUint8Array } from './util';

describe('Tarball', () => {

	it('has a toJSON() option', () => {
		const tarball = new Tarball(base64ToUint8Array(tarballSampleBase64));
		expect(tarball.toJSON()).toBeTruthy();
	});

	it('can safely be stringified when an invalid buffer is given', () => {
		const tarball = new Tarball(null);
		expect(() => JSON.stringify(tarball)).not.toThrowError();
	});
});