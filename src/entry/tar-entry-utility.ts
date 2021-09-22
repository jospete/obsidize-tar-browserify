import { TarHeaderExtractionResult, TarHeaderUtility, TarHeader } from '../header';
import { TarUtility } from '../tar-utility';

const {
	SECTOR_SIZE,
	isNumber,
	isUint8Array,
	advanceSectorOffset,
	roundUpSectorOffset
} = TarUtility;

export interface TarEntryMetadata {
	header: TarHeaderExtractionResult;
	content?: Uint8Array | null;
	byteLength: number;
}

export interface TarEntryAttributes {
	header: Partial<TarHeader>;
	content?: Uint8Array | null;
}

/**
 * Common pure functions for serializing and deserializing tar entries,
 * including both the entry header and its content.
 */
export namespace TarEntryUtility {

	// ---------------- Extraction Utilities ----------------

	/**
	 * Searches through the given input buffer for the next tar entry, starting at the given offset.
	 * Does not modify the input buffer.
	 */
	export function extractEntryMetadata(input: Uint8Array, offset: number = 0): TarEntryMetadata | null {

		if (!isUint8Array(input)) {
			return null;
		}

		const ustarSectorOffset = TarHeaderUtility.findNextUstarSectorOffset(input, offset);

		if (ustarSectorOffset < 0) {
			return null;
		}

		const maxOffset = input.byteLength;
		const header = TarHeaderUtility.extractHeaderContent(input, ustarSectorOffset);

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

	// ---------------- Creation Utilities ----------------

	export function generateCompositeBuffer(files: TarEntryAttributes[]): Uint8Array {
		return files.reduce(appendEntryBuffer, new Uint8Array(0));
	}

	export function appendEntryBuffer(accumulatedBuffer: Uint8Array, attrs: TarEntryAttributes): Uint8Array {

		const fileTarBuffer = generateEntryBuffer(attrs);

		if (!isUint8Array(fileTarBuffer)) {
			return accumulatedBuffer;
		}

		const accumulatedSize = accumulatedBuffer.byteLength;
		const combined = new Uint8Array(accumulatedSize + fileTarBuffer!.byteLength);

		combined.set(accumulatedBuffer, 0);
		combined.set(fileTarBuffer!, accumulatedSize);

		return combined;
	}

	export function generateEntryBuffer(attrs: TarEntryAttributes): Uint8Array | null {

		if (!attrs) {
			return null;
		}

		const { header, content } = attrs;
		const contentSize = content ? content.byteLength : 0;

		if (header) {
			header.fileSize = contentSize;
		}

		const headerBuffer = TarHeaderUtility.generateHeaderBuffer(header);
		const headerSize = headerBuffer.byteLength;
		const fileTarBuffer = new Uint8Array(headerSize + contentSize);

		fileTarBuffer.set(headerBuffer, 0);

		if (contentSize > 0) {
			fileTarBuffer.set(content!, headerSize);
		}

		return fileTarBuffer;
	}
}