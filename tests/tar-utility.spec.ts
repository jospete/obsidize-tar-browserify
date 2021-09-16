import { TarHeaderFieldDefinition, TarUtility } from '../src';

import { range } from './util';

const { parseIntSafe, sliceFieldBuffer } = TarUtility;

describe('TarUtility', () => {

	describe('parseIntSafe', () => {

		it('includes a radix parameter to match the native parseInt() api', () => {
			expect(parseIntSafe('1000', 2)).toBe(8);
		});

		it('includes a default radix of 10', () => {
			expect(parseIntSafe('1000')).toBe(1000);
		});

		it('provides a default value parameter for parse errors', () => {
			expect(parseIntSafe('not_a_number', 10, 42)).toBe(42);
		});

		it('leaves already-numeric numbers unaffected', () => {
			expect(parseIntSafe(100, 10, 42)).toBe(100);
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