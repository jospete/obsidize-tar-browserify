import { TarHeaderExtractionResult, TarHeaderUtility, TarHeader } from '../header';
import { TarUtility } from '../tar-utility';

export interface TarEntryMetadata {
	header: TarHeaderExtractionResult;
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

		let { header, content } = (value || {});

		if (!header) header = TarHeaderUtility.expandHeaderToExtractionResult(null);
		if (!content) content = null;

		const contentLength = TarUtility.sizeofUint8Array(content);

		// The fileSize field metadata must always be in sync between the content and the header
		if (header.fileSize.value !== contentLength) {
			const headerAttrs = TarHeaderUtility.flattenHeaderExtractionResult(header);
			headerAttrs.fileSize = contentLength;
			header = TarHeaderUtility.expandHeaderToExtractionResult(headerAttrs);
		}

		return { header, content };
	}

	// ---------------- Extraction Utilities ----------------

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
		const fileSize = header.fileSize ? header.fileSize.value : null;
		const start = TarUtility.advanceSectorOffset(ustarSectorOffset, maxOffset);

		let content: Uint8Array | null = null;

		if (TarUtility.isNumber(fileSize) && fileSize > 0) {
			const end = Math.min(maxOffset, start + fileSize);
			content = input.slice(start, end);
		}

		return { header, content };
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

		let contentSize = 0;
		let paddedContent = content!;

		if (TarUtility.isUint8Array(content)) {
			contentSize = content!.byteLength;
		}

		const offsetDelta = TarUtility.getSectorOffsetDelta(contentSize);

		if (contentSize > 0 && offsetDelta > 0) {
			paddedContent = TarUtility.concatUint8Arrays(content!, new Uint8Array(offsetDelta));
		}

		if (header) {
			header.fileSize = contentSize;
		}

		const headerBuffer = TarHeaderUtility.generateHeaderBuffer(header);
		return TarUtility.concatUint8Arrays(headerBuffer, paddedContent);
	}
}