import { TarHeaderFieldDefinition, TarHeader } from './tar-header';
import { TarUtility } from './tar-utility';
import { TarEntry } from './tar-entry';

const { isUstarSector, advanceSectorOffset, readFieldValue, isNumber } = TarUtility;

export interface TarEntryExtractionResult {
	file: TarEntry | null;
	nextOffset: number;
}

export function extractTarEntry(input: Uint8Array, currentOffset: number, maxOffset: number): TarEntryExtractionResult {

	let offset = currentOffset;

	// Search for next sector tagged with the ustar indicator
	while (offset < maxOffset && !isUstarSector(input, offset)) {
		offset = advanceSectorOffset(offset, maxOffset);
	}

	// We finished the search and did not find a ustar indicator, so no file to extract
	if (offset >= maxOffset) {
		return {
			file: null,
			nextOffset: offset
		};
	}

	const headerFields = TarHeaderFieldDefinition.orderedSet();
	const header: TarHeader = {} as any;

	// Read all the header fields from the sector and parse/store their values
	headerFields.forEach(field => {
		Object.assign(header, {
			[field.name]: readFieldValue(field, input, offset)
		});
	});

	// Advance to the data of the file
	offset = advanceSectorOffset(offset, maxOffset);

	const { fileSize } = header;

	let content: Uint8Array | null = null;

	// If we read a legitimate file size...
	if (isNumber(fileSize) && fileSize > 0) {

		const fileEndOffset = offset + fileSize;

		// Read the file content and advance the offset
		content = input.slice(offset, fileEndOffset);
		offset = advanceSectorOffset(fileEndOffset, maxOffset);
	}

	return {
		file: new TarEntry(header, content),
		nextOffset: offset
	};
}