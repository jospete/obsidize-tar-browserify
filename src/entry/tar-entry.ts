import { ArchiveContext } from '../common/archive-context';
import { AsyncUint8ArrayLike } from '../common/async-uint8-array';
import { TarSerializable, TarUtility } from '../common/tar-utility';
import { TarHeader } from '../header/tar-header';
import { UstarHeaderLike } from '../header/ustar/ustar-header-like';
import { UstarHeaderLinkIndicatorType } from '../header/ustar/ustar-header-link-indicator-type';

export interface TarEntryOptions {
	header?: TarHeader;
	content?: Uint8Array | null;
	offset?: number;
	context?: ArchiveContext | null;
}

/**
 * Container for metadata and content of a tarball entry.
 * 
 * Here, we consider an "entry" to be a tuple of:
 * 1. The parsed USTAR header sector content (AKA TarHeader)
 * 2. The aggregate of the proceeding file content sectors, based on the header's file size attribute
 */
export class TarEntry implements UstarHeaderLike, TarSerializable {

	protected mHeader: TarHeader;
	protected mContent: Uint8Array | null;
	protected mOffset: number;
	protected mContext: ArchiveContext | null;

	constructor(options: TarEntryOptions = {}) {
		this.initialize(options);
	}

	public static isTarEntry(v: any): boolean {
		return !!(v && v instanceof TarEntry);
	}

	/**
	 * Convenience parser
	 * @param attrs - partial header data POJO
	 * @param content - content of the entry (if it is a file)
	 */
	public static from(attrs: UstarHeaderLike | Partial<UstarHeaderLike>, content: Uint8Array | null = null): TarEntry {
		return new TarEntry({header: TarHeader.from(attrs), content});
	}

	protected initialize(options: TarEntryOptions): this {
		let {header, content, offset, context} = options;

		if (!header) header = TarHeader.seeded();
		if (!content) content = null;
		if (!offset) offset = 0;
		if (!context) context = null;

		const contentLength = TarUtility.sizeofUint8Array(content);

		// The fileSize field metadata must always be in sync between the content and the header
		if (!header.pax && header.fileSize !== contentLength && contentLength > 0) {
			header.ustarFileSize = contentLength;
			header.normalize();
		}

		this.mHeader = header;
		this.mContent = content;
		this.mOffset = offset;
		this.mContext = context;

		return this;
	}

	// =================================================================
	// TarHeader Interface Fields
	// =================================================================

	public get fileName(): string {
		return this.header.fileName;
	}

	public get fileSize(): number {
		return this.header.fileSize;
	}

	public get fileMode(): number {
		return this.header.fileMode;
	}

	public get ownerUserId(): number {
		return this.header.ownerUserId;
	}

	public get groupUserId(): number {
		return this.header.groupUserId;
	}

	public get lastModified(): number {
		return this.header.lastModified;
	}

	public get headerChecksum(): number {
		return this.header.headerChecksum;
	}

	public get linkedFileName(): string {
		return this.header.linkedFileName;
	}

	public get typeFlag(): UstarHeaderLinkIndicatorType {
		return this.header.typeFlag;
	}

	public get ustarIndicator(): string {
		return this.header.ustarIndicator;
	}

	public get ustarVersion(): string {
		return this.header.ustarVersion;
	}

	public get ownerUserName(): string {
		return this.header.ownerUserName;
	}

	public get ownerGroupName(): string {
		return this.header.ownerGroupName;
	}

	public get deviceMajorNumber(): string {
		return this.header.deviceMajorNumber;
	}

	public get deviceMinorNumber(): string {
		return this.header.deviceMinorNumber;
	}

	public get fileNamePrefix(): string {
		return this.header.fileNamePrefix;
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
	 * The context (if any) from which this entry was parsed.
	 * The context will include global data about things such as
	 * the origin of the archive and global pax headers.
	 */
	public get context(): ArchiveContext | null | undefined {
		return this.mContext;
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
		return this.header.byteLength + this.fileSize;
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
		return this.header.byteLength + this.bufferStartIndex;
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
	public async readContentFrom(buffer: AsyncUint8ArrayLike, offset: number = 0, length: number = 0): Promise<Uint8Array> {
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
	public toJSON(): Record<string, unknown> {
		const { header, fileName: name, fileSize: size, content } = this;
		const isFile = this.isFile();
		const isDirectory = this.isDirectory();
		const type = isFile ? 'file' : isDirectory ? 'directory' : 'complex';
		const contentType = content
			? ('Uint8Array[' + content.byteLength + ']')
			: 'null';

		return {
			name,
			size,
			type,
			header,
			contentType,
			content: TarUtility.getDebugHexString(content)
		};
	}
}
