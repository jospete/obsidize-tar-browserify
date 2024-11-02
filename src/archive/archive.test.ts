import { InMemoryAsyncUint8Array } from '../common/async-uint8-array';
import { fileStructures, tarballSampleBase64 } from '../test/generated/tarball-test-content';
import { base64ToUint8Array } from '../test/test-util';
import { Archive } from './archive';
import { ArchiveReader } from './archive-reader';

describe('Archive', () => {
	it('can safely be stringified when an invalid buffer is given', () => {
		const archive = new Archive();
		expect(() => JSON.stringify(archive)).not.toThrow();
	});

	describe('extract()', () => {
		it('is a shortcut for ArchiveReader.readAllEntriesFromMemory()', async () => {
			const spy = jest.spyOn(ArchiveReader, 'readAllEntriesFromMemory');
			const sampleUint8 = base64ToUint8Array(tarballSampleBase64);
			const {entries} = await Archive.extract(sampleUint8);
			const firstFile = entries.find(v => v.isFile())!;
			const firstFileName = fileStructures[0][0];
			expect(firstFile.fileName).toEqual(`./${firstFileName}`);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(sampleUint8);
		});
	});

	describe('extractFromStream()', () => {
		it('is a shortcut for ArchiveReader.readAllEntriesFromStream()', async () => {
			const sampleUint8 = base64ToUint8Array(tarballSampleBase64);
			const stream = new InMemoryAsyncUint8Array(sampleUint8);
			const spy = jest.spyOn(ArchiveReader, 'readAllEntriesFromStream');
			await Archive.extractFromStream(stream);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(stream);
		});
	});
});
