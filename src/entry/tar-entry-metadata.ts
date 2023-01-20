import { advanceSectorOffset, AsyncUint8Array, isNumber, isUint8Array, sizeofUint8Array } from '../common';
import { TarHeaderExtractionResult, TarHeaderUtility } from '../header';

export interface TarEntryMetadataLike {
	header: TarHeaderExtractionResult;
	offset: number;
	content?: Uint8Array | null;
}

/**
 * Entry data parsed from a buffer, with header metadata built-in.
 * Counterpart to `TarEntryAttributes`.
 */
export class TarEntryMetadata implements TarEntryMetadataLike {

	constructor(
		public readonly header: TarHeaderExtractionResult,
		public readonly content: Uint8Array | null = null,
		public readonly offset: number = 0,
	) {
	}

	public static from(value: TarEntryMetadataLike): TarEntryMetadata {

		let { header, content, offset } = (value || {});

		if (!header) header = TarHeaderUtility.expandHeaderToExtractionResult(null);
		if (!content) content = null;
		if (!offset) offset = 0;

		const contentLength = sizeofUint8Array(content);

		// The fileSize field metadata must always be in sync between the content and the header
		if (header.fileSize.value !== contentLength && contentLength > 0) {
			const headerAttrs = TarHeaderUtility.flattenHeaderExtractionResult(header);
			headerAttrs.fileSize = contentLength;
			header = TarHeaderUtility.expandHeaderToExtractionResult(headerAttrs);
		}

		return new TarEntryMetadata(header, content, offset);
	}

	/**
	 * Searches through the given input buffer for the next tar entry, starting at the given offset.
	 * Does not modify the input buffer.
	 */
	public static extractFrom(input: Uint8Array, offset: number = 0): TarEntryMetadata | null {

		if (!isUint8Array(input)) {
			return null;
		}

		const ustarSectorOffset = TarHeaderUtility.findNextUstarSectorOffset(input, offset);

		if (ustarSectorOffset < 0) {
			return null;
		}

		const maxOffset = input.byteLength;
		const header = TarHeaderUtility.extractHeaderContent(input, ustarSectorOffset);
		const start = advanceSectorOffset(ustarSectorOffset, maxOffset);
		const fileSize = header.fileSize.value;

		let content: Uint8Array | null = null;

		if (isNumber(fileSize) && fileSize > 0) {
			const end = Math.min(maxOffset, start + fileSize);
			content = input.slice(start, end);
		}

		return new TarEntryMetadata(header, content, ustarSectorOffset);
	}

	/**
	 * Searches through the given AsyncUint8Array for the next available tar entry from the given offset.
	 * 
	 * NOTE: Unlike `extractFrom()`, this does not try to load the file content into memory and
	 * assumes that the entry may be a file that is too large to load. It is up to the caller to 
	 * load this content if needed.
	 */
	public static async extractFromAsync(
		input: AsyncUint8Array,
		offset: number = 0
	): Promise<TarEntryMetadata | null> {

		if (!input) {
			return null;
		}

		const sector = await TarHeaderUtility.findNextUstarSectorAsync(input, offset);

		if (!sector) {
			return null;
		}

		const { value, offset: ustarSectorOffset } = sector;
		const header = TarHeaderUtility.extractHeaderContent(value);
		const content = null;

		return new TarEntryMetadata(header, content, ustarSectorOffset);
	}
}