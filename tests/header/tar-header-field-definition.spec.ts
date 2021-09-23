import { TarHeaderFieldDefinition, TarHeaderFieldType } from '../../src';

describe('TarHeaderFieldDefinition', () => {

	it('is a collection of header metadata options to streamline tar header parsing', () => {
		const fileNameMetadata = TarHeaderFieldDefinition.fileName();
		expect(fileNameMetadata.type).toBe(TarHeaderFieldType.ASCII_PADDED);
	});
});