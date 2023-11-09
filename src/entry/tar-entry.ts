import { AsyncUint8Array } from '../common/async-uint8array';
import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeader } from '../header/tar-header';
import { TarHeaderLike } from '../header/tar-header-like';
import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';
import { TarEntryUtility } from './tar-entry-utility';

/**
 * Container for metadata and content of a tarball entry.
 * 
 * Here, we consider an "entry" to be a tuple of:
 * 1. The parsed USTAR header sector content (AKA TarHeader)
 * 2. The aggregate of the proceeding file content sectors, based on the header's file size attribute
 */
export class TarEntry implements TarHeaderLike {

	protected mHeader: TarHeader;
	protected mContent: Uint8Array | null;
	protected mOffset: number;

	constructor(header?: TarHeader, content?: Uint8Array | null, offset?: number) {
		this.initialize(header, content, offset);
	}

	public static isTarEntry(v: any): boolean {
		return !!(v && v instanceof TarEntry);
	}

	/**
	 * Convenience parser
	 * @param attrs - partial header data POJO
	 * @param content - content of the entry (if it is a file)
	 */
	public static from(attrs: TarHeaderLike | Partial<TarHeaderLike>, content: Uint8Array | null = null): TarEntry {
		return new TarEntry(TarHeader.from(attrs), content);
	}

	/**
	 * Searches through the given input buffer for the next tar header,
	 * and creates a new `TarEntry` for it if it is found.
	 * @param input - the buffer to search for a tar entry in
	 * @param offset - the offset of the buffer to begin searching at
	 * @returns A new `TarEntry` if a header sector was found, otherwise null
	 */
	public static tryParse(input: Uint8Array, offset?: number): TarEntry | null {

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

		return new TarEntry(header, content, ustarSectorOffset);
	}

	/**
	 * Searches through the given input buffer for the next tar header,
	 * and creates a new `TarEntry` for it if it is found.
	 * @param input - the buffer to search for a tar entry in
	 * @param offset - the offset of the buffer to begin searching at
	 * @returns A new `TarEntry` if a header sector was found, otherwise null
	 */
	public static async tryParseAsync(input: AsyncUint8Array, offset?: number): Promise<TarEntry | null> {
		
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

		return new TarEntry(header, content, ustarSectorOffset);
	}

	/**
	 * Combines the given array of entries into a single, complete tarball buffer
	 */
	public static serialize(entries: TarEntry[]): Uint8Array {

		let outputLength = Constants.TERMINAL_PADDING_SIZE;

		for (const entry of entries) {
			outputLength += entry.sectorByteLength;
		}

		const output = new Uint8Array(outputLength);
		let offset = 0;

		for (const entry of entries) {
			entry.writeTo(output, offset);
			offset += entry.sectorByteLength;
		}

		return output;
	}

	protected initialize(
		header?: TarHeader, 
		content?: Uint8Array | null,
		offset?: number
	): this {

		if (!header) header = TarHeader.seeded();
		if (!content) content = null;
		if (!offset) offset = 0;

		const contentLength = TarUtility.sizeofUint8Array(content);

		// The fileSize field metadata must always be in sync between the content and the header
		if (header.fileSize !== contentLength && contentLength > 0) {
			header.fileSize = contentLength;
			header.normalize();
		}

		this.mHeader = header;
		this.mContent = content;
		this.mOffset = offset;

		return this;
	}

	// =================================================================
	// TarHeader Interface Fields
	// =================================================================

	public get fileName(): string {
		return this.header.fileName;
	}

	public set fileName(value: string) {
		this.header.fileName = value;
	}

	public get fileSize(): number {
		return this.header.fileSize;
	}

	public set fileSize(value: number) {
		this.header.fileSize = value;
	}

	public get fileMode(): number {
		return this.header.fileMode;
	}

	public set fileMode(value: number) {
		this.header.fileMode = value;
	}

	public get ownerUserId(): number {
		return this.header.ownerUserId;
	}

	public set ownerUserId(value: number) {
		this.header.ownerUserId = value;
	}

	public get groupUserId(): number {
		return this.header.groupUserId;
	}

	public set groupUserId(value: number) {
		this.header.groupUserId = value;
	}

	public get lastModified(): number {
		return this.header.lastModified;
	}

	public set lastModified(value: number) {
		this.header.lastModified = value;
	}

	public get headerChecksum(): number {
		return this.header.headerChecksum;
	}

	public get linkedFileName(): string {
		return this.header.linkedFileName;
	}

	public set linkedFileName(value: string) {
		this.header.linkedFileName = value;
	}

	public get typeFlag(): TarHeaderLinkIndicatorType {
		return this.header.typeFlag;
	}

	public set typeFlag(value: TarHeaderLinkIndicatorType) {
		this.header.typeFlag = value;
	}

	public get ustarIndicator(): string {
		return this.header.ustarIndicator;
	}

	public get ustarVersion(): string {
		return this.header.ustarVersion;
	}

	public set ustarVersion(value: string) {
		this.header.ustarVersion = value;
	}

	public get ownerUserName(): string {
		return this.header.ownerUserName;
	}

	public set ownerUserName(value: string) {
		this.header.ownerUserName = value;
	}

	public get ownerGroupName(): string {
		return this.header.ownerGroupName;
	}

	public set ownerGroupName(value: string) {
		this.header.ownerGroupName = value;
	}

	public get deviceMajorNumber(): string {
		return this.header.deviceMajorNumber;
	}

	public set deviceMajorNumber(value: string) {
		this.header.deviceMajorNumber = value;
	}

	public get deviceMinorNumber(): string {
		return this.header.deviceMinorNumber;
	}

	public set deviceMinorNumber(value: string) {
		this.header.deviceMinorNumber = value;
	}

	public get fileNamePrefix(): string {
		return this.header.fileNamePrefix;
	}

	public set fileNamePrefix(value: string) {
		this.header.fileNamePrefix = value;
	}

	// =================================================================
	// Introspection Fields
	// =================================================================

	/**
	 * The header metadata parsed out for this entry.
	 * See TarHeaderFieldDefinition for details.
	 */
	public get header(): TarHeader {
		return this.mHeader;
	}

	/**
	 * The file content for this entry.
	 * This may be null for entries loaded asynchronously, or
	 * for non-file entries like directories.
	 */
	public get content(): Uint8Array | null | undefined {
		return this.mContent;
	}

	/**
	 * The starting absolute index (inclusive) in the source buffer that this entry was parsed from.
	 * Returns zero by default if this was not parsed by a source buffer.
	 */
	public get bufferStartIndex(): number {
		return this.mOffset;
	}

	/**
	 * The ending absolute index (exclusive) in the source buffer that this entry was parsed from.
	 * Returns sectorByteLength by default if this was not parsed by a source buffer.
	 */
	public get bufferEndIndex(): number {
		return this.bufferStartIndex + this.sectorByteLength;
	}

	/**
	 * The total exact byte length of this entry, including the header.
	 */
	public get byteLength(): number {
		return Constants.HEADER_SIZE + this.fileSize;
	}

	/**
	 * The total byte length of this entry, including the header, 
	 * which is a multiple of the standard tar sector size.
	 */
	public get sectorByteLength(): number {
		return TarUtility.roundUpSectorOffset(this.byteLength);
	}

	/**
	 * The starting index (inclusive) of the content of this entry.
	 * Note that this will always be the first index of the header, regardless of
	 * whether or not this is a file.
	 */
	public get contentStartIndex(): number {
		return Constants.HEADER_SIZE + this.bufferStartIndex;
	}

	/**
	 * The ending index (exclusive) of the content of this entry.
	 * If this entry is not a file, or the file is empty, this will be
	 * the same as the content starting index.
	 */
	public get contentEndIndex(): number {
		return this.contentStartIndex + this.fileSize;
	}

	/**
	 * Convenience for decoding the current content buffer as a string.
	 * Note that if the content was not loaded for whatever reason, this
	 * will return an empty string.
	 * @returns The decoded string data from the currently assigned content,
	 * or an empty string if there is no content assigned.
	 */
	public getContentAsText(): string {
		return TarUtility.decodeString(this.content!);
	}

	public isDirectory(): boolean {
		return this.header.isDirectoryHeader;
	}

	public isFile(): boolean {
		return this.header.isFileHeader;
	}

	/**
	 * Only necessary if this entry was extracted from an async buffer, since the entry
	 * does not hold the content of async buffers by default.
	 * 
	 * If the entry was extracted synchronously, its content will be available via the "content" property.
	 */
	public async readContentFrom(buffer: AsyncUint8Array, offset: number = 0, length: number = 0): Promise<Uint8Array> {
		const { contentStartIndex, contentEndIndex, fileSize } = this;
		const normalizedOffset = TarUtility.clamp(offset, 0, fileSize) + contentStartIndex;
		const bytesRemaining = Math.max(0, contentEndIndex - normalizedOffset);
		const normalizedLength = length > 0 ? Math.min(length, bytesRemaining) : bytesRemaining;
		return buffer.read(normalizedOffset, normalizedLength);
	}

	/**
	 * Writes the header and content of this entry to the given output
	 * @param output - the buffer to be written to
	 * @param offset - the offset in the buffer to start writing entry data
	 * @returns true if this entry was successfully written to the output
	 */
	public writeTo(output: Uint8Array, offset: number): boolean {

		if (!TarUtility.isUint8Array(output)
			|| output.byteLength < (offset + this.sectorByteLength)) {
			return false;
		}

		const headerBytes = this.header.normalize().toUint8Array();

		output.set(headerBytes, offset);
		offset += headerBytes.byteLength;

		if (this.content) {
			output.set(this.content, offset);
		}

		return true;
	}

	/**
	 * @returns This instance serialized as a single slice for a tar buffer
	 */
	public toUint8Array(): Uint8Array {

		const headerBytes = this.header.normalize().toUint8Array();
		const result = new Uint8Array(this.sectorByteLength);
		result.set(headerBytes, 0);

		if (this.content) {
			result.set(this.content, headerBytes.byteLength);
		}

		return result;
	}

	/**
	 * Overridden to prevent circular reference errors / huge memory spikes that would
	 * include the underlying content by default.
	 */
	public toJSON(): any {

		const { header, fileName, fileSize } = this;
		const isFile = this.isFile();
		const isDirectory = this.isDirectory();
		const content = this.content
			? ('Uint8Array[' + this.content.byteLength + ']')
			: 'null';

		return {
			content,
			fileName,
			fileSize,
			isFile,
			isDirectory,
			header
		};
	}
}