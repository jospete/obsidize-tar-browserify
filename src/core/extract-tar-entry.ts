import { TarHeaderFieldDefinition, TarHeader } from './tar-header';
import { TarUtility } from './tar-utility';
import { TarEntry } from './tar-entry';

const { isUstarSector, advanceSectorOffset, readFieldValue, isNumber, isUint8Array } = TarUtility;

export interface TarEntryExtractionResult {
	entry: TarEntry | null;
	nextOffset: number;
}

/**
 * Searches through the given input buffer for the next tar entry, starting at the given offset.
 * 
 */
export function extractTarEntry(input: Uint8Array, offset: number = 0): TarEntryExtractionResult {

	// Invalid buffer given, abort
	if (!isUint8Array(input)) {
		return { entry: null, nextOffset: offset };
	}

	const maxOffset = input.byteLength;
	let nextOffset = Math.max(0, offset);

	// Search for next sector tagged with the ustar indicator
	while (nextOffset < maxOffset && !isUstarSector(input, nextOffset)) {
		nextOffset = advanceSectorOffset(nextOffset, maxOffset);
	}

	// We finished the search and did not find a ustar indicator, so no file to extract
	if (nextOffset >= maxOffset) {
		return { entry: null, nextOffset };
	}

	const headerFields = TarHeaderFieldDefinition.orderedSet();
	const header: TarHeader = {} as any;

	// Read all the header fields from the sector and parse/store their values
	headerFields.forEach(field => {
		Object.assign(header, {
			[field.name]: readFieldValue(field, input, nextOffset)
		});
	});

	// Advance to the data of the file
	nextOffset = advanceSectorOffset(nextOffset, maxOffset);

	const { fileSize } = header;

	let content: Uint8Array | null = null;

	// If we read a legitimate file size...
	if (isNumber(fileSize) && fileSize > 0) {

		const fileEndOffset = nextOffset + fileSize;

		// Read the file content and advance the offset
		content = input.slice(nextOffset, fileEndOffset);
		nextOffset = advanceSectorOffset(fileEndOffset, maxOffset);
	}

	const entry = new TarEntry(header, content);

	return { entry, nextOffset };
}