import { Tarball } from '../../src';

import { tarballSampleBase64 } from '../generated/tarball-test-assets';
import { MockAsyncUint8Array } from '../mocks/mock-async-uint8array';
import { base64ToUint8Array } from '../util';

describe('Tarball', () => {

	it('can safely be stringified when an invalid buffer is given', () => {
		const tarball = new Tarball();
		expect(() => JSON.stringify(tarball)).not.toThrowError();
	});

	describe('extract() / create()', () => {

		it('creates a tarball from the given entries', async () => {
			const sampleUint8 = base64ToUint8Array(tarballSampleBase64);
			const entries = Tarball.extract(sampleUint8);
			const outputUint8 = Tarball.create(entries.map(e => e.toAttributes()));
			expect(outputUint8).toEqual(sampleUint8);
		});
	});

	describe('extractAsync()', () => {

		it('creates a tarball from the given entries', async () => {
			const sampleUint8 = base64ToUint8Array(tarballSampleBase64);
			const mockAsyncBuffer = new MockAsyncUint8Array(sampleUint8);
			const entries = await Tarball.extractAsync(mockAsyncBuffer);
			expect(entries).toBeDefined();
			expect(entries.length > 0).toBe(true);
		});
	});

	describe('setBuffer() / toUint8Array()', () => {

		it('creates a tarball from the given entries', async () => {
			const sampleUint8 = base64ToUint8Array(tarballSampleBase64);
			const tarball = new Tarball();
			const outputUint8 = tarball.setBuffer(sampleUint8).toUint8Array();
			expect(outputUint8).toEqual(sampleUint8);
		});
	});
});