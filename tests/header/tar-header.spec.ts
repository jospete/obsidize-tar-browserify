import {
	Constants,
	TarEntryUtility,
	TarHeader,
	TarHeaderField,
	TarHeaderLinkIndicatorType,
	TarUtility
} from '../../src';

const {
	concatUint8Arrays,
	isUint8Array
} = TarUtility;

const {
	findNextUstarSectorOffset,
	findNextUstarSectorAsync
} = TarEntryUtility;

const {
	FILE_MODE_DEFAULT,
	SECTOR_SIZE,
	HEADER_SIZE
} = Constants;

import { MockAsyncUint8Array } from '../mocks/mock-async-uint8array';

describe('TarHeader', () => {

	it('can be created with an explicit buffer and offset', () => {

		const blockSize = HEADER_SIZE;
		const offset = blockSize;
		const bufferLength = blockSize * 2;
		const buffer = new Uint8Array(bufferLength);
		const header = new TarHeader(buffer, offset);
		const updatedFileMode = 123;

		expect(header.fileMode).toBe(0);

		header.fileMode = updatedFileMode;
		expect(TarHeaderField.fileMode.readFrom(buffer, offset)).toBe(updatedFileMode);
	});

	it('returns a type flag of UNKNOWN when it fails to retrieve the type flag info', () => {
		const header = new TarHeader(new Uint8Array(10));
		expect(header.typeFlag).toBe(TarHeaderLinkIndicatorType.UNKNOWN);
	});

	describe('from()', () => {

		it('returns the input value as-is if it is already a TarHeader instance', () => {
			const header = new TarHeader();
			const parsedHeader = TarHeader.from(header);
			expect(parsedHeader).toBe(header);
		});
	});

	describe('slice()', () => {

		it('returns a blank instance if the given input is not a Uint8Array', () => {
			const header = TarHeader.slice(null as any, 0);
			expect(header).toBeTruthy();
			expect(header.bytes.every(b => b === 0)).toBe(true);
		});
	});

	describe('initialize()', () => {

		it('applies default values if no custom object is given', () => {

			const header = new TarHeader();

			expect(header.deviceMajorNumber).toBe('');
			expect(header.fileMode).toBe(0);

			header.initialize();

			expect(header.deviceMajorNumber).toBe('00');
			expect(header.fileMode).toBe(Constants.FILE_MODE_DEFAULT);
		});

		it('applies a combination of default values and custom ones if a custom object is given', () => {

			const header = new TarHeader();
			const fileName = 'test file.txt';

			expect(header.fileName).toBe('');
			expect(header.fileMode).toBe(0);

			header.initialize({fileName});

			expect(header.fileName).toBe(fileName);
			expect(header.fileMode).toBe(Constants.FILE_MODE_DEFAULT);
		});
	});

	describe('update()', () => {

		it('applies given values to the backing buffer', () => {
			
			const fileMode = 511;
			const header = new TarHeader();

			header.update({fileMode});
			const bufferText = TarUtility.decodeString(TarHeaderField.fileMode.slice(header.bytes));

			expect(header.fileMode).toBe(fileMode);
			expect(bufferText).toBe('000777 \0');
		});

		it('does nothing if the given attributes are malformed', () => {

			const header = new TarHeader();
			spyOn(header, 'normalize').and.callThrough();

			header.update(null as any);
			expect(header.normalize).not.toHaveBeenCalled();

			header.update({});
			expect(header.normalize).not.toHaveBeenCalled();

			header.update({fileMode: 123});
			expect(header.normalize).toHaveBeenCalledTimes(1);
		});
	});

	describe('normalize()', () => {

		it('populates missing fields with sensible defaults', () => {
			const header = TarHeader.seeded();
			expect(header).not.toBeFalsy();
			expect(header.bytes.length).toBe(Constants.HEADER_SIZE);
			expect(header.fileMode).toBe(FILE_MODE_DEFAULT);
			expect(header.typeFlag).toBe(TarHeaderLinkIndicatorType.NORMAL_FILE);
		});

		it('consistently encodes and decodes the same header buffer', () => {

			const header1 = TarHeader.from({
				fileName: 'Test File.txt',
				fileSize: 50000,
				fileMode: 450
			});
	
			const headerBuffer1 = TarHeader.serialize(header1);
			expect(isUint8Array(headerBuffer1)).toBe(true);
			expect(headerBuffer1.byteLength).toBe(HEADER_SIZE);
	
			const header2 = new TarHeader(headerBuffer1);
			const headerBuffer2 = header2.toUint8Array();
			expect(headerBuffer2).toEqual(headerBuffer1);
	
			// We should be able to serialize and deserialize the same header multiple times without any data loss.
			const header3 = new TarHeader(headerBuffer2);
			expect(header3.fileName).toBe(header1.fileName);
			expect(header3.fileSize).toBe(header1.fileSize);
			expect(header3.fileMode).toBe(header1.fileMode);
		});
	});

	describe('findNextUstarSectorOffset()', () => {

		it('returns the offset of the next header sector', () => {
			const testHeaderBuffer = TarHeader.serialize(null as any);
			expect(findNextUstarSectorOffset(testHeaderBuffer)).toBe(0);
		});

		it('returns -1 when there is no ustar sector in the given scope', () => {
			expect(findNextUstarSectorOffset(null as any)).toBe(-1);
		});

		it('uses the given offset when it is provided', () => {

			const padLength = SECTOR_SIZE * 2;
			const paddingBuffer = new Uint8Array(padLength);
			const testHeaderBuffer = TarHeader.serialize(null as any);
			const combinedBuffer = concatUint8Arrays(paddingBuffer, testHeaderBuffer);

			expect(findNextUstarSectorOffset(combinedBuffer)).toBe(padLength);
			expect(findNextUstarSectorOffset(combinedBuffer, padLength)).toBe(padLength);
			expect(findNextUstarSectorOffset(combinedBuffer, combinedBuffer.byteLength - 10)).toBe(-1);
		});

		it('snaps negative offsets to zero', () => {
			const testHeaderBuffer = TarHeader.serialize(null as any);
			expect(findNextUstarSectorOffset(testHeaderBuffer, -1)).toBe(0);
			expect(findNextUstarSectorOffset(testHeaderBuffer, -123456)).toBe(0);
		});
	});

	describe('findNextUstarSectorAsync()', () => {

		it('returns null when malformed inputs are given', async () => {
			expect(await findNextUstarSectorAsync(null as any)).toBe(null);
			const mockBuffer = new Uint8Array(5);
			const mockAsyncBuffer = new MockAsyncUint8Array(mockBuffer);
			expect(await findNextUstarSectorAsync(mockAsyncBuffer, mockBuffer.byteLength)).toBe(null);
		});
	});
});