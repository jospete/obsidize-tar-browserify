import { TarHeaderFieldDefinition, TarHeaderUtility } from '../../src';

import { range } from '../util';

const { sliceFieldBuffer } = TarHeaderUtility;

describe('TarHeaderUtility', () => {

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