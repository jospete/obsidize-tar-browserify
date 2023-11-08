import { AsyncUint8Array } from '../common/async-uint8array';
import { TarUtility } from '../common/tar-utility';
import { TarHeader } from '../header/tar-header';
import { TarEntryUtility } from './tar-entry-utility';

export interface TarEntryMetadataLike {
	header: TarHeader;
	offset: number;
	content?: Uint8Array | null;
}

/**
 * Entry data parsed from a buffer, with header metadata built-in.
 * Counterpart to `TarEntryAttributes`.
 */
export class TarEntryMetadata implements TarEntryMetadataLike {

	constructor(
		public readonly header: TarHeader,
		public readonly content: Uint8Array | null,
		public readonly offset: number,
	) {
	}

	public static isTarEntryMetadata(value: any): boolean {
		return !!(value && (value instanceof TarEntryMetadata));
	}

	public static from(value: TarEntryMetadataLike): TarEntryMetadata {

		if (TarEntryMetadata.isTarEntryMetadata(value)) {
			return value as TarEntryMetadata;
		}

		let { header, content, offset } = (value || {});

		if (!header) header = TarHeader.seeded();
		if (!content) content = null;
		if (!offset) offset = 0;

		const contentLength = TarUtility.sizeofUint8Array(content);

		// The fileSize field metadata must always be in sync between the content and the header
		if (header.fileSize !== contentLength && contentLength > 0) {
			header.fileSize = contentLength;
			header.normalize();
		}

		return new TarEntryMetadata(header, content, offset);
	}

	/**
	 * Searches through the given input buffer for the next tar entry, starting at the given offset.
	 * Does not modify the input buffer.
	 */
	public static extractFrom(input: Uint8Array, offset: number = 0): TarEntryMetadata | null {

		if (!TarUtility.isUint8Array(input)) {
			return null;
		}

		const ustarSectorOffset = TarEntryUtility.findNextUstarSectorOffset(input, offset);

		if (ustarSectorOffset < 0) {
			return null;
		}

		const maxOffset = input.byteLength;
		// FIXME: replace slice with standard constructor when TarEntry is migrated to the same format
		// const header = new TarHeader(input, ustarSectorOffset);
		const header = TarHeader.slice(input, ustarSectorOffset);
		const start = TarUtility.advanceSectorOffset(ustarSectorOffset, maxOffset);
		const fileSize = header.fileSize;

		let content: Uint8Array | null = null;

		if (TarUtility.isNumber(fileSize) && fileSize > 0) {
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

		const sector = await TarEntryUtility.findNextUstarSectorAsync(input, offset);

		if (!sector) {
			return null;
		}

		const { value, offset: ustarSectorOffset } = sector;
		const header = new TarHeader(value);
		const content = null;

		return new TarEntryMetadata(header, content, ustarSectorOffset);
	}
}