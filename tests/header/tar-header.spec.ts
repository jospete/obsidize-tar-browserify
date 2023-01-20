import {
	Constants,
	findNextUstarSectorAsync,
	findNextUstarSectorOffset,
	sanitizeHeader,
	TarHeaderLinkIndicatorType,
	TarHeaderMetadata,
	TarUtility
} from '../../src';

const {
	concatUint8Arrays
} = TarUtility;

const {
	FILE_MODE_DEFAULT,
	SECTOR_SIZE,
} = Constants;

import { MockAsyncUint8Array } from '../mocks/mock-async-uint8array';

describe('TarHeader', () => {

	describe('sanitizeHeader()', () => {

		it('populates missing fields with sensible defaults', () => {
			const header = sanitizeHeader(null);
			expect(header).not.toBeFalsy();
			expect(header.fileMode).toBe(FILE_MODE_DEFAULT);
			expect(header.typeFlag).toBe(TarHeaderLinkIndicatorType.NORMAL_FILE);
		});
	});

	describe('findNextUstarSectorOffset()', () => {

		it('returns the offset of the next header sector', () => {
			const testHeaderBuffer = TarHeaderMetadata.serialize(null);
			expect(findNextUstarSectorOffset(testHeaderBuffer)).toBe(0);
		});

		it('returns -1 when there is no ustar sector in the given scope', () => {
			expect(findNextUstarSectorOffset(null as any)).toBe(-1);
		});

		it('uses the given offset when it is provided', () => {

			const padLength = SECTOR_SIZE * 2;
			const paddingBuffer = new Uint8Array(padLength);
			const testHeaderBuffer = TarHeaderMetadata.serialize(null);
			const combinedBuffer = concatUint8Arrays(paddingBuffer, testHeaderBuffer);

			expect(findNextUstarSectorOffset(combinedBuffer)).toBe(padLength);
			expect(findNextUstarSectorOffset(combinedBuffer, padLength)).toBe(padLength);
			expect(findNextUstarSectorOffset(combinedBuffer, combinedBuffer.byteLength - 10)).toBe(-1);
		});

		it('snaps negative offsets to zero', () => {
			const testHeaderBuffer = TarHeaderMetadata.serialize(null);
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