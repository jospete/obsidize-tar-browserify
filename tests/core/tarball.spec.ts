import { Tarball, TarHeaderLinkIndicatorType } from '../../src';

import { tarballSampleBase64 } from '../generated/tarball-test-assets';
import { MockAsyncUint8Array } from '../mocks/mock-async-uint8array';
import { base64ToUint8Array } from '../util';

describe('Tarball', () => {

	it('can safely be stringified when an invalid buffer is given', () => {
		const tarball = new Tarball();
		expect(() => JSON.stringify(tarball)).not.toThrowError();
	});

	it('can be instantiated with a backing buffer', () => {
		expect(() => new Tarball(new Uint8Array(100))).not.toThrowError();
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

	describe('add()', () => {

		it('includes the given entry in generated output', async () => {

			const tarball = new Tarball();

			tarball.add({ header: { fileName: 'test.txt' }, content: new Uint8Array(10) });
			const entries = Tarball.extract(tarball.toUint8Array());

			expect(entries.length).toBe(1);
			expect(entries[0].fileName).toBe('test.txt');
		});
	});

	describe('addBinaryFile()', () => {

		it('is a shortcut for adding a standard file entry', () => {

			const tarball = new Tarball();
			const fileName = 'test.txt';
			const fileContent = new Uint8Array(10);

			tarball.addBinaryFile(fileName, fileContent);

			const [entry] = tarball.entries;

			expect(tarball.entries.length).toBe(1);
			expect(entry.isFile()).toBe(true);
			expect(entry.fileName).toBe(fileName);
			expect(entry.fileSize).toBe(fileContent.byteLength);
			expect(entry.typeFlag).toBe(TarHeaderLinkIndicatorType.NORMAL_FILE);
		});

		it('accepts custom header options as an additional parameter', () => {

			const tarball = new Tarball();
			const fileName = 'test.txt';
			const fileContent = new Uint8Array(10);
			const overrideType = TarHeaderLinkIndicatorType.CONTIGUOUS_FILE;

			tarball.addBinaryFile(fileName, fileContent, { typeFlag: overrideType });

			const [entry] = tarball.entries;

			expect(entry.typeFlag).toBe(overrideType);
		});
	});

	describe('addTextFile()', () => {

		it('is a shortcut for adding a standard file entry', () => {

			const tarball = new Tarball();
			const fileName = 'test.txt';
			const fileContent = 'This is some text';

			tarball.addTextFile(fileName, fileContent);

			const [entry] = tarball.entries;

			expect(tarball.entries.length).toBe(1);
			expect(entry.isFile()).toBe(true);
			expect(entry.fileName).toBe(fileName);
			expect(entry.getContentAsText()).toBe(fileContent);
			expect(entry.typeFlag).toBe(TarHeaderLinkIndicatorType.NORMAL_FILE);
		});

		it('accepts custom header options as an additional parameter', () => {

			const tarball = new Tarball();
			const fileName = 'test.txt';
			const fileContent = 'This is some text';
			const overrideType = TarHeaderLinkIndicatorType.CONTIGUOUS_FILE;

			tarball.addTextFile(fileName, fileContent, { typeFlag: overrideType });

			const [entry] = tarball.entries;

			expect(entry.typeFlag).toBe(overrideType);
		});
	});

	describe('addDirectory()', () => {

		it('is a shortcut for adding a standard directory entry', () => {

			const tarball = new Tarball();
			const fileName = './sample/directory/path';

			tarball.addDirectory(fileName);

			const [entry] = tarball.entries;

			expect(tarball.entries.length).toBe(1);
			expect(entry.fileName).toBe(fileName);
			expect(entry.fileSize).toBe(0);
			expect(entry.isDirectory()).toBe(true);
			expect(entry.typeFlag).toBe(TarHeaderLinkIndicatorType.DIRECTORY);
			expect(entry.ownerUserName).toBe('');
		});

		it('accepts custom header options as an additional parameter', () => {

			const tarball = new Tarball();
			const fileName = './sample/directory/path';
			const overrideUser = 'someguy';

			tarball.addDirectory(fileName, { ownerUserName: overrideUser });

			const [entry] = tarball.entries;

			expect(entry.ownerUserName).toBe(overrideUser);
		});
	});
});