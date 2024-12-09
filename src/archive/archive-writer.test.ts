import { TarHeaderField } from '../header/tar-header-field';
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

	describe('PAX header construction', () => {
		it('should NOT serialize with a PAX header when the name does not exceed the default max USTAR filename field size', async () => {
			const fileName = ''.padEnd(TarHeaderField.fileName.size, 'a');
			const writer = new ArchiveWriter();
			writer.addTextFile(fileName, 'test content for long file name');
			const entries = await ArchiveReader.readAllEntriesFromMemory(writer.toUint8Array());
			expect(entries.length).toBe(1);
			const [entry] = entries;
			expect(entry.fileName).toBe(fileName);
			expect(entry.header.isPaxHeader).toBe(false);
		});

		it('should serialize with a PAX header when the name exceeds the default max USTAR filename field size', async () => {
			const fileName = ''.padEnd(TarHeaderField.fileName.size + 1, 'a');
			const writer = new ArchiveWriter();
			writer.addTextFile(fileName, 'test content for long file name');
			const entries = await ArchiveReader.readAllEntriesFromMemory(writer.toUint8Array());
			expect(entries.length).toBe(1);
			const [entry] = entries;
			expect(entry.fileName).toBe(fileName);
			expect(entry.header.isPaxHeader).toBe(true);
		});
	});

	describe('removeEntriesWhere()', () => {
		it('should remove entries from the entries array that meet the given predicate condition', () => {
			const writer = new ArchiveWriter()
				.addTextFile('sample1.txt', 'this is a file')
				.addTextFile('another file.txt', 'this is a file with white-space in the name');
			expect(writer.entries.length).toBe(2);

			writer.removeEntriesWhere(v => / /.test(v.fileName));
			expect(writer.entries.length).toBe(1);

			// doing it again should have no effect
			writer.removeEntriesWhere(v => / /.test(v.fileName));
			expect(writer.entries.length).toBe(1);
		});
	});

	describe('cleanAllHeaders()', () => {
		it('should call clean() on the header of each entry', async () => {
			const writer = new ArchiveWriter()
				.addTextFile('sample1.txt', 'this is a file')
				.addTextFile('another file.txt', 'this is a file with white-space in the name');
			
			const entry1Spy = jest.spyOn(writer.entries[0].header, 'clean');
			const entry2Spy = jest.spyOn(writer.entries[0].header, 'clean');
			writer.cleanAllHeaders();
			
			expect(entry1Spy).toHaveBeenCalledTimes(1);
			expect(entry2Spy).toHaveBeenCalledTimes(1);
		});
	});
});
