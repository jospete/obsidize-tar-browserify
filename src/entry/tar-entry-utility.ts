import { TarUtility, AsyncUint8Array } from '../common';
import { TarHeaderExtractionResult, TarHeaderUtility, TarHeader } from '../header';

export interface TarEntryMetadata {
	header: TarHeaderExtractionResult;
	offset: number;
	content?: Uint8Array | null;
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

	// ---------------- Common Utilities ----------------

	export function sanitizeTarEntryMetadata(value: TarEntryMetadata): TarEntryMetadata {

		let { header, content, offset } = (value || {});

		if (!header) header = TarHeaderUtility.expandHeaderToExtractionResult(null);
		if (!content) content = null;
		if (!offset) offset = 0;

		const contentLength = TarUtility.sizeofUint8Array(content);

		// The fileSize field metadata must always be in sync between the content and the header
		if (header.fileSize.value !== contentLength && contentLength > 0) {
			const headerAttrs = TarHeaderUtility.flattenHeaderExtractionResult(header);
			headerAttrs.fileSize = contentLength;
			header = TarHeaderUtility.expandHeaderToExtractionResult(headerAttrs);
		}

		return { header, content, offset };
	}

	// ---------------- Extraction Utilities ----------------

	/**
	 * Searches through the given AsyncUint8Array for the next available tar entry from the given offset.
	 * 
	 * NOTE: Unlike extractEntryMetadata(), this does not try to load the file content into memory and
	 * assumes that the entry may be a file that is too large to load. It is up to the caller to load this content if needed.
	 */
	export async function extractEntryMetadataAsync(input: AsyncUint8Array, offset: number = 0): Promise<TarEntryMetadata | null> {

		if (!input) {
			return null;
		}

		const sector = await TarHeaderUtility.findNextUstarSectorAsync(input, offset);

		if (!sector) {
			return null;
		}

		const { value, offset: sectorOffset } = sector;
		const header = TarHeaderUtility.extractHeaderContent(value);
		const content = null;

		return { header, content, offset: sectorOffset };
	}

	/**
	 * Searches through the given input buffer for the next tar entry, starting at the given offset.
	 * Does not modify the input buffer.
	 */
	export function extractEntryMetadata(input: Uint8Array, offset: number = 0): TarEntryMetadata | null {

		if (!TarUtility.isUint8Array(input)) {
			return null;
		}

		const ustarSectorOffset = TarHeaderUtility.findNextUstarSectorOffset(input, offset);

		if (ustarSectorOffset < 0) {
			return null;
		}

		const maxOffset = input.byteLength;
		const header = TarHeaderUtility.extractHeaderContent(input, ustarSectorOffset);
		const start = TarUtility.advanceSectorOffset(ustarSectorOffset, maxOffset);
		const fileSize = header.fileSize.value;

		let content: Uint8Array | null = null;

		if (TarUtility.isNumber(fileSize) && fileSize > 0) {
			const end = Math.min(maxOffset, start + fileSize);
			content = input.slice(start, end);
		}

		return { header, content, offset: ustarSectorOffset };
	}

	// ---------------- Creation Utilities ----------------

	export function generateCompositeBuffer(files: TarEntryAttributes[]): Uint8Array {
		return files.reduce(appendEntryBuffer, new Uint8Array(0));
	}

	export function appendEntryBuffer(accumulatedBuffer: Uint8Array, attrs: TarEntryAttributes): Uint8Array {
		const fileTarBuffer = generateEntryBuffer(attrs);
		return TarUtility.concatUint8Arrays(accumulatedBuffer, fileTarBuffer!);
	}

	export function generatePaddedCompositeBuffer(files: TarEntryAttributes[]): Uint8Array {
		return TarUtility.concatUint8Arrays(
			generateCompositeBuffer(files),
			new Uint8Array(TarUtility.SECTOR_SIZE * 2)
		);
	}

	export function generateEntryBuffer(attrs: TarEntryAttributes): Uint8Array | null {

		if (!attrs) {
			return null;
		}

		const { header, content } = attrs;
		const contentSize = TarUtility.sizeofUint8Array(content);
		const offsetDelta = TarUtility.getSectorOffsetDelta(contentSize);

		let paddedContent = content!;

		if (contentSize > 0 && offsetDelta > 0) {
			paddedContent = TarUtility.concatUint8Arrays(content!, new Uint8Array(offsetDelta));
		}

		const safeHeader = TarHeaderUtility.sanitizeHeader(header);
		safeHeader.fileSize = contentSize;

		const headerBuffer = TarHeaderUtility.generateHeaderBuffer(safeHeader);
		return TarUtility.concatUint8Arrays(headerBuffer, paddedContent);
	}
}