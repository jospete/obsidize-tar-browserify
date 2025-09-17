import { fileStructures, tarballSampleBase64 } from '../test/generated/tarball-test-content.ts';
import { base64ToUint8Array } from '../test/test-util.ts';
import { ArchiveReader } from './archive-reader.ts';
import { Archive } from './archive.ts';

describe('Archive', () => {
	it('can safely be stringified when an invalid buffer is given', () => {
		const archive = new Archive();
		expect(() => JSON.stringify(archive)).not.toThrow();
	});

	describe('extract()', () => {
		it('is a shortcut for ArchiveReader.wrap()', async () => {
			const spy = jest.spyOn(ArchiveReader, 'withInput');
			const sampleUint8 = base64ToUint8Array(tarballSampleBase64);
			const { entries } = await Archive.extract(sampleUint8);
			const firstFile = entries.find((v) => v.isFile())!;
			const firstFileName = fileStructures[0][0];
			expect(firstFile.fileName).toEqual(`./${firstFileName}`);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(sampleUint8);
		});
	});
});
