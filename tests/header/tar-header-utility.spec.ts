import { TarHeaderFieldDefinition, TarHeaderUtility } from '../../src';

import { range } from '../util';

const { sliceFieldBuffer, decodeLastModifiedTime, encodeLastModifiedTime } = TarHeaderUtility;

const staticDateTime = 1632419077000;
const staticDateTimeEncoded = 1632419077;

describe('TarHeaderUtility', () => {

	describe('decodeLastModifiedTime()', () => {

		it('converts the encoded value to a valid date time', () => {
			expect(decodeLastModifiedTime(staticDateTimeEncoded)).toBe(staticDateTime);
		});

		it('floors floating point values', () => {
			expect(decodeLastModifiedTime(staticDateTimeEncoded + 0.9)).toBe(staticDateTime);
		});
	});

	describe('encodeLastModifiedTime()', () => {

		it('encodes the value to a serializable mtime', () => {
			expect(encodeLastModifiedTime(staticDateTime)).toBe(staticDateTimeEncoded);
		});

		it('floors floating point values', () => {
			expect(encodeLastModifiedTime(staticDateTime + 0.9)).toBe(staticDateTimeEncoded);
		});
	});

	describe('sliceFieldBuffer', () => {

		it('defaults to offset zero when no offset is provided', () => {
			const buffer = Uint8Array.from(range(0x1FF));
			const headerField = TarHeaderFieldDefinition.fileSize();
			const slicedBuffer = sliceFieldBuffer(headerField, buffer);
			const sliceStart = headerField.offset;
			const sliceEnd = sliceStart + headerField.size;
			expect(slicedBuffer).toEqual(buffer.slice(sliceStart, sliceEnd));
		});
	});
});