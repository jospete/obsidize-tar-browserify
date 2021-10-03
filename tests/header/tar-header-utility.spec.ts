import { TarHeaderFieldDefinition, TarHeaderLinkIndicatorType, TarHeaderUtility, TarUtility } from '../../src';

import { range } from '../util';

const staticDateTime = 1632419077000;
const staticDateTimeEncoded = 1632419077;

describe('TarHeaderUtility', () => {

	describe('decodeLastModifiedTime()', () => {

		it('converts the encoded value to a valid date time', () => {
			expect(TarHeaderUtility.decodeLastModifiedTime(staticDateTimeEncoded)).toBe(staticDateTime);
		});

		it('floors floating point values', () => {
			expect(TarHeaderUtility.decodeLastModifiedTime(staticDateTimeEncoded + 0.9)).toBe(staticDateTime);
		});
	});

	describe('encodeLastModifiedTime()', () => {

		it('encodes the value to a serializable mtime', () => {
			expect(TarHeaderUtility.encodeLastModifiedTime(staticDateTime)).toBe(staticDateTimeEncoded);
		});

		it('floors floating point values', () => {
			expect(TarHeaderUtility.encodeLastModifiedTime(staticDateTime + 0.9)).toBe(staticDateTimeEncoded);
		});
	});

	describe('sliceFieldBuffer()', () => {

		it('defaults to offset zero when no offset is provided', () => {
			const buffer = Uint8Array.from(range(0x1FF));
			const headerField = TarHeaderFieldDefinition.fileSize();
			const slicedBuffer = TarHeaderUtility.sliceFieldBuffer(headerField, buffer);
			const sliceStart = headerField.offset;
			const sliceEnd = sliceStart + headerField.size;
			expect(slicedBuffer).toEqual(buffer.slice(sliceStart, sliceEnd));
		});
	});

	describe('sliceFieldAscii()', () => {

		it('performs additional conversion on a Uint8Array to read the bytes as an ascii string', () => {
			const testChar = 'Z';
			const testCharCode = testChar.charCodeAt(0);
			const buffer = Uint8Array.from(range(0x1FF).map(() => testCharCode));
			const headerField = TarHeaderFieldDefinition.fileName();
			const slicedAscii = TarHeaderUtility.sliceFieldAscii(headerField, buffer);
			expect(slicedAscii).toEqual(''.padEnd(headerField.size, testChar));
		});
	});

	describe('isUstarSector()', () => {

		it('returns true if the buffer contains a ustar indicator', () => {
			const testHeaderBuffer = TarHeaderUtility.generateHeaderBuffer(null);
			expect(TarHeaderUtility.isUstarSector(testHeaderBuffer)).toBe(true);
		});

		it('returns false if the buffer does NOT contain a ustar indicator', () => {
			expect(TarHeaderUtility.isUstarSector(null)).toBe(false);
			expect(TarHeaderUtility.isUstarSector(new Uint8Array(0))).toBe(false);
		});
	});

	describe('sanitizeHeader()', () => {

		it('populates missing fields with sensible defaults', () => {
			const header = TarHeaderUtility.sanitizeHeader(null);
			expect(header).not.toBeFalsy();
			expect(header.fileMode).toBe('777');
			expect(header.typeFlag).toBe(TarHeaderLinkIndicatorType.NORMAL_FILE);
		});
	});

	describe('findNextUstarSectorOffset()', () => {

		it('returns the offset of the next header sector', () => {
			const testHeaderBuffer = TarHeaderUtility.generateHeaderBuffer(null);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer)).toBe(0);
		});

		it('returns -1 when there is no ustar sector in the given scope', () => {
			expect(TarHeaderUtility.findNextUstarSectorOffset(null)).toBe(-1);
		});

		it('uses the given offset when it is provided', () => {

			const padLength = TarUtility.SECTOR_SIZE * 2;
			const paddingBuffer = new Uint8Array(padLength);
			const testHeaderBuffer = TarHeaderUtility.generateHeaderBuffer(null);
			const combinedBuffer = TarUtility.concatUint8Arrays(paddingBuffer, testHeaderBuffer);

			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer)).toBe(padLength);
			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer, padLength)).toBe(padLength);
			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer, combinedBuffer.byteLength - 10)).toBe(-1);
		});

		it('snaps negative offsets to zero', () => {
			const testHeaderBuffer = TarHeaderUtility.generateHeaderBuffer(null);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer, -1)).toBe(0);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer, -123456)).toBe(0);
		});
	});

	describe('deserializeIntegerOctalFromString()', () => {

		it('translates the given octal string into a number', () => {
			expect(TarHeaderUtility.deserializeIntegerOctalFromString('777')).toBe(parseInt('777', 8));
		});

		it('removes trailing zeroes and white space', () => {
			expect(TarHeaderUtility.deserializeIntegerOctalFromString('0000777 \0\0\0\0')).toBe(parseInt('777', 8));
		});

		it('returns a default value when the given input cannot be parsed to a number', () => {
			expect(TarHeaderUtility.deserializeIntegerOctalFromString(null)).toBe(0);
		});
	});

	describe('parseFieldValue()', () => {

		it('interprets the given value based on the given field metadata', () => {
			const valueOctal = '777';
			const value = parseInt(valueOctal, 8);
			const field = TarHeaderFieldDefinition.fileMode();
			const fieldValue = TarHeaderUtility.serializeFieldValue(field, value);
			expect(TarHeaderUtility.deserializeFieldValue(field, fieldValue)).toBe(value);
		});

		it('decodes mtime values to proper Date timestamps', () => {
			const now = TarHeaderUtility.decodeLastModifiedTime(TarHeaderUtility.encodeLastModifiedTime(Date.now()));
			const field = TarHeaderFieldDefinition.lastModified();
			const fieldValue = TarHeaderUtility.serializeFieldValue(field, now);
			expect(TarHeaderUtility.deserializeFieldValue(field, fieldValue)).toBe(now);
		});
	});
});