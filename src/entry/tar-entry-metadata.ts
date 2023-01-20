import { AsyncUint8Array, AsyncUint8ArraySearchResult, findInAsyncUint8Array } from '../common/async-uint8array';
import { advanceSectorOffset, isNumber, isUint8Array, sizeofUint8Array } from '../common/transforms';
import { isUstarSector } from '../header/tar-header-field-definitions';
import { TarHeaderMetadata } from '../header/tar-header-metadata';


export interface TarEntryMetadataLike {
	header: TarHeaderMetadata;
	offset: number;
	content?: Uint8Array | null;
}

/**
 * Searches through the given AsyncUint8Array for the next USTAR sector,
 * starting at the given offset.
 */
export function findNextUstarSectorAsync(
	input: AsyncUint8Array,
	offset: number = 0
): Promise<AsyncUint8ArraySearchResult | null> {
	return findInAsyncUint8Array(
		input,
		offset,
		1,
		value => isUstarSector(value)
	);
}

/**
 * Searches the given input buffer for a USTAR header tar sector, starting at the given offset.
 * Returns -1 if no valid header sector is found.
 */
export function findNextUstarSectorOffset(input: Uint8Array, offset: number = 0): number {

	const NOT_FOUND = -1;

	if (!isUint8Array(input)) {
		return NOT_FOUND;
	}

	const maxOffset = input.byteLength;
	let nextOffset = Math.max(0, offset);

	while (nextOffset < maxOffset && !isUstarSector(input, nextOffset)) {
		nextOffset = advanceSectorOffset(nextOffset, maxOffset);
	}

	if (nextOffset < maxOffset) {
		return nextOffset;
	}

	return NOT_FOUND;
}

/**
 * Entry data parsed from a buffer, with header metadata built-in.
 * Counterpart to `TarEntryAttributes`.
 */
export class TarEntryMetadata implements TarEntryMetadataLike {

	constructor(
		public readonly header: TarHeaderMetadata,
		public readonly content: Uint8Array | null,
		public readonly offset: number,
	) {
	}

	public static isTarEntryMetadata(value: any): boolean {
		return !!(value && (value instanceof TarEntryMetadata));
	}

	public static from(value: TarEntryMetadataLike): TarEntryMetadata {

		if (TarEntryMetadata.isTarEntryMetadata(value))
			return value as TarEntryMetadata;

		let { header, content, offset } = (value || {});

		if (!header) header = new TarHeaderMetadata();
		if (!content) content = null;
		if (!offset) offset = 0;

		const contentLength = sizeofUint8Array(content);

		// The fileSize field metadata must always be in sync between the content and the header
		if (header.fileSize.value !== contentLength && contentLength > 0) {
			header.update({ fileSize: contentLength });
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

		const ustarSectorOffset = findNextUstarSectorOffset(input, offset);

		if (ustarSectorOffset < 0) {
			return null;
		}

		const maxOffset = input.byteLength;
		const header = TarHeaderMetadata.from(input, ustarSectorOffset);
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

		const sector = await findNextUstarSectorAsync(input, offset);

		if (!sector) {
			return null;
		}

		const { value, offset: ustarSectorOffset } = sector;
		const header = TarHeaderMetadata.from(value);
		const content = null;

		return new TarEntryMetadata(header, content, ustarSectorOffset);
	}
}