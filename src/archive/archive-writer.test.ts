import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';
import { ArchiveReader } from './archive-reader';
import { ArchiveWriter } from './archive-writer';

describe('ArchiveWriter', () => {
	it('should be creatable', () => {
		const writer = new ArchiveWriter();
		expect(writer).toBeTruthy();
	});	

	describe('addEntryWith()', () => {
		it('includes the given entry in generated output', async () => {
			const tarball = new ArchiveWriter();

			tarball.addEntryWith({ fileName: 'test.txt' }, new Uint8Array(10));
			const entries = await ArchiveReader.readAllEntriesFromMemory(tarball.toUint8Array());

			expect(entries.length).toBe(1);
			expect(entries[0].fileName).toBe('test.txt');
		});
	});

	describe('addBinaryFile()', () => {
		it('is a shortcut for adding a standard file entry', () => {
			const tarball = new ArchiveWriter();
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
			const tarball = new ArchiveWriter();
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
			const tarball = new ArchiveWriter();
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
			const tarball = new ArchiveWriter();
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
			const tarball = new ArchiveWriter();
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
			const tarball = new ArchiveWriter();
			const fileName = './sample/directory/path';
			const overrideUser = 'someguy';

			tarball.addDirectory(fileName, { ownerUserName: overrideUser });

			const [entry] = tarball.entries;

			expect(entry.ownerUserName).toBe(overrideUser);
		});
	});
});
