import {
	Constants,
	TarHeaderMetadata,
	TarHeaderUtility,
	TarUtility
} from '../../src';

const { HEADER_SIZE } = Constants;
const { isUint8Array } = TarUtility;

describe('TarHeaderMetadata', () => {

	it('consistently encodes and decodes the same header buffer', () => {

		const header1 = TarHeaderUtility.sanitizeHeader({
			fileName: 'Test File.txt',
			fileSize: 50000,
			fileMode: 450
		});

		const headerBuffer1 = TarHeaderMetadata.serialize(header1);
		expect(isUint8Array(headerBuffer1)).toBe(true);
		expect(headerBuffer1.byteLength).toBe(HEADER_SIZE);

		const header2 = TarHeaderMetadata.from(headerBuffer1);
		const headerBuffer2 = header2.toUint8Array();
		expect(headerBuffer2).toEqual(headerBuffer1);

		// We should be able to serialize and deserialize the same header multiple times without any data loss.
		const header3 = TarHeaderMetadata.deflateFrom(headerBuffer2);
		expect(header3.fileName).toBe(header1.fileName);
		expect(header3.fileSize).toBe(header1.fileSize);
		expect(header3.fileMode).toBe(header1.fileMode);
	});

	describe('flatten()', () => {

		it('returns an unpopulated object when the input is malformed', () => {
			const flattened = TarHeaderMetadata.deflateFrom(null as any);
			const { headerChecksum } = flattened;
			const expected = Object.assign(TarHeaderUtility.getDefaultHeaderValues(), { headerChecksum });
			expect(flattened).toEqual(expected);
		});

		it('properly handles malformed objects', () => {
			const flattened = TarHeaderMetadata.deflateFrom({ fileName: null } as any);
			const { headerChecksum } = flattened;
			const expected = Object.assign(TarHeaderUtility.getDefaultHeaderValues(), { headerChecksum });
			expect(flattened).toEqual(expected);
		});
	});
});