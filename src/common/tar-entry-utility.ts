import { TarHeaderExtractionResult } from './tar-header-extraction-result';
import { TarHeaderUtility } from './tar-header-utility';
import { TarUtility } from './tar-utility';
import { TarHeader } from './tar-header';

const {
	findNextUstarSectorOffset,
	extractHeader,
	generateHeaderSector
} = TarHeaderUtility;

const {
	SECTOR_SIZE,
	isNumber,
	isUint8Array,
	advanceSectorOffset,
	roundUpSectorOffset
} = TarUtility;

export interface TarEntryMetadata {
	header: TarHeaderExtractionResult;
	content: Uint8Array | null;
	byteLength: number;
}

/**
 * Common pure functions for serializing and deserializing tar entries,
 * including both the entry header and its content.
 */
export namespace TarEntryUtility {

	/**
	 * Creates the static content that goes at the end of the tar file.
	 */
	export function createTarFileEndingSectors(): Uint8Array {
		const size = SECTOR_SIZE * 2;
		const result = new Uint8Array(size);
		result.fill(0, 0, size);
		return result;
	}

	/**
	 * Generates a single unified tar buffer that can be written out as a *.tar file.
	 */
	export function createTarEntryBuffer(header: TarHeader, content: Uint8Array): Uint8Array {

		const headerSize = SECTOR_SIZE;
		const contentSize = isUint8Array(content) ? content.byteLength : 0;
		const totalSize = roundUpSectorOffset(headerSize + contentSize);
		const result = new Uint8Array(totalSize);

		result.set(generateHeaderSector(header), 0);

		if (contentSize > 0) {
			result.set(content, headerSize);
		}

		return result;
	}

	/**
	 * Searches through the given input buffer for the next tar entry, starting at the given offset.
	 * Does not modify the input buffer.
	 */
	export function extractTarEntryMetadata(input: Uint8Array, offset: number = 0): TarEntryMetadata | null {

		if (!isUint8Array(input)) {
			return null;
		}

		const ustarSectorOffset = findNextUstarSectorOffset(input, offset);

		if (ustarSectorOffset < 0) {
			return null;
		}

		const maxOffset = input.byteLength;
		const header = extractHeader(input, ustarSectorOffset);

		if (!header) {
			return null;
		}

		const fileSize = header.fileSize ? header.fileSize.value : null;

		let content: Uint8Array | null = null;
		let byteLength = SECTOR_SIZE;

		if (isNumber(fileSize) && fileSize > 0) {

			const contentOffset = advanceSectorOffset(ustarSectorOffset, maxOffset);
			const fileEndOffset = contentOffset + fileSize;

			content = input.slice(contentOffset, fileEndOffset);
			byteLength += roundUpSectorOffset(fileSize);
		}

		return { header, content, byteLength };
	}
}