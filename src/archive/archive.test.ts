import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';
import { fileStructures, tarballSampleBase64 } from '../test/generated/tarball-test-content';
import { base64ToUint8Array } from '../test/test-util';
import { Archive } from './archive';

describe('Archive', () => {
	it('can safely be stringified when an invalid buffer is given', () => {
		const tarball = new Archive();
		expect(() => JSON.stringify(tarball)).not.toThrowError();
	});

	describe('extract()', () => {
		it('parses all entries from a given tar buffer', async () => {
			const sampleUint8 = base64ToUint8Array(tarballSampleBase64);
			const entries = await Archive.extract(sampleUint8);
			const firstFile = entries.find(v => v.isFile())!;
			const firstFileName = fileStructures[0][0];
			expect(firstFile.fileName).toEqual(`./${firstFileName}`);
		});
	});

	// describe('setBuffer() / toUint8Array()', () => {
	// 	it('creates a tarball from the given entries', async () => {
	// 		const sampleUint8 = base64ToUint8Array(tarballSampleBase64);
	// 		const tarball = new Archive();
	// 		const outputUint8 = tarball.setBuffer(sampleUint8).toUint8Array();
	// 		expect(outputUint8).toEqual(sampleUint8);
	// 	});
	// });

	describe('addEntryWith()', () => {
		it('includes the given entry in generated output', async () => {
			const tarball = new Archive();

			tarball.addEntryWith({ fileName: 'test.txt' }, new Uint8Array(10));
			const entries = await Archive.extract(tarball.toUint8Array());

			expect(entries.length).toBe(1);
			expect(entries[0].fileName).toBe('test.txt');
		});
	});

	describe('addBinaryFile()', () => {
		it('is a shortcut for adding a standard file entry', () => {
			const tarball = new Archive();
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
			const tarball = new Archive();
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
			const tarball = new Archive();
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
			const tarball = new Archive();
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
			const tarball = new Archive();
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
			const tarball = new Archive();
			const fileName = './sample/directory/path';
			const overrideUser = 'someguy';

			tarball.addDirectory(fileName, { ownerUserName: overrideUser });

			const [entry] = tarball.entries;

			expect(entry.ownerUserName).toBe(overrideUser);
		});
	});
});