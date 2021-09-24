import { TarHeaderFieldDefinition, TarHeaderLinkIndicatorType, TarHeaderUtility } from '../../src';

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
});