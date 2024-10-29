import { ArchiveWriter } from './archive-writer';

describe('ArchiveWriter', () => {
	it('should be creatable', () => {
		const writer = new ArchiveWriter();
		expect(writer).toBeTruthy();
	});
});
