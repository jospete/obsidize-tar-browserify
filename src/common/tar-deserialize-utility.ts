import { TarHeaderFieldDefinition, TarHeader, TarHeaderField, TarHeaderFieldType } from './tar-header';
import { TarUtility } from './tar-utility';
import { TarEntry } from '../core/tar-entry';

const {
	USTAR_INDICATOR_VALUE,
	advanceSectorOffset,
	removeTrailingZeros,
	parseIntSafe,
	isNumber,
	toString,
	isUint8Array,
	sliceFieldAscii
} = TarUtility;

const {
	ustarIndicator
} = TarHeaderFieldDefinition;

/**
 * Output result type when extractTarEntry() is called.
 */
export interface TarEntryExtractionResult {
	entry: TarEntry | null;
	nextOffset: number;
}

/**
 * Collection of utility functions for parsing a tar buffer.
 */
export namespace TarDeserializeUtility {

	export function parseOctalIntSafe(value: string): number {
		return parseIntSafe(toString(value).trim(), 8);
	}

	export function isUstarSector(input: Uint8Array, offset: number): boolean {
		return sliceFieldAscii(ustarIndicator(), input, offset) === USTAR_INDICATOR_VALUE;
	}

	export function parseFieldValue(field: TarHeaderField, value: string): any {
		const { type } = field;
		switch (type) {
			case TarHeaderFieldType.INTEGER_OCTAL:
				return parseOctalIntSafe(value);
			case TarHeaderFieldType.INTEGER_OCTAL_ASCII:
				return removeTrailingZeros(toString(value).trim());
			case TarHeaderFieldType.ASCII_TRIMMED:
				return removeTrailingZeros(value);
			case TarHeaderFieldType.ASCII:
			default:
				return value;
		}
	}

	/**
	 * Searches through the given input buffer for the next tar entry, starting at the given offset.
	 * Does not modify the input buffer.
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
				[field.name]: sliceFieldAscii(field, input, nextOffset)
			});
		});

		// Advance to the data of the file
		nextOffset = advanceSectorOffset(nextOffset, maxOffset);

		const { fileSize } = header;
		const parsedFileSize = parseOctalIntSafe(fileSize);

		let content: Uint8Array | null = null;

		// If we read a legitimate file size...
		if (isNumber(parsedFileSize) && parsedFileSize > 0) {

			const fileEndOffset = nextOffset + parsedFileSize;

			// Read the file content and advance the offset
			content = input.slice(nextOffset, fileEndOffset);
			nextOffset = advanceSectorOffset(fileEndOffset, maxOffset);
		}

		const entry = new TarEntry(header, content);

		return { entry, nextOffset };
	}
}