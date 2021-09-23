import { TarHeaderExtractionResult, TarHeaderUtility, TarHeader } from '../header';
import { TarUtility } from '../tar-utility';

export interface TarEntryContentMetadata {
	value?: Uint8Array | null;
	start: number;
	end: number;
}

export interface TarEntryMetadata {
	header: TarHeaderExtractionResult;
	content: TarEntryContentMetadata;
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

	export function wrapEntryContentMetadata(input: Uint8Array | null | undefined): TarEntryContentMetadata {

		let value = input;
		let end = TarUtility.isUint8Array(value) ? value!.byteLength : 0;

		const start = 0;
		const sectorPadding = TarUtility.roundUpSectorOffset(end);

		if (sectorPadding > 0) {
			end += sectorPadding;
			value = new Uint8Array(end);
			value.set(input!, 0);
		}

		return { value, start, end };
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
		const fileSize = header.fileSize ? header.fileSize.value : null;
		const start = TarUtility.advanceSectorOffset(ustarSectorOffset, maxOffset);

		let value: Uint8Array | null = null;
		let end = start;

		if (TarUtility.isNumber(fileSize) && fileSize > 0) {
			end = TarUtility.roundUpSectorOffset(start + fileSize);
			value = input.slice(start, end);
		}

		return { header, content: { value, start, end } };
	}

	// ---------------- Creation Utilities ----------------

	export function generateCompositeBuffer(files: TarEntryAttributes[]): Uint8Array {
		const combinedWithoutEndPadding = files.reduce(appendEntryBuffer, new Uint8Array(0));
		const paddingBuffer = new Uint8Array(TarUtility.SECTOR_SIZE * 2);
		return TarUtility.concatUint8Arrays(combinedWithoutEndPadding, paddingBuffer);
	}

	export function appendEntryBuffer(accumulatedBuffer: Uint8Array, attrs: TarEntryAttributes): Uint8Array {
		const fileTarBuffer = generateEntryBuffer(attrs);
		return TarUtility.concatUint8Arrays(accumulatedBuffer, fileTarBuffer!);
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
		return TarUtility.concatUint8Arrays(headerBuffer, content!);
	}
}