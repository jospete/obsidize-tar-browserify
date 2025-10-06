import { ArchiveContext, ArchiveEntryLike } from '../common/archive-context.ts';
import { AsyncUint8ArrayLike } from '../common/async-uint8-array.ts';
import { TarSerializable, TarUtility } from '../common/tar-utility.ts';
import { TarHeader } from '../header/tar-header.ts';
import { UstarHeaderLike } from '../header/ustar/ustar-header-like.ts';
import { UstarHeaderLinkIndicatorType } from '../header/ustar/ustar-header-link-indicator-type.ts';
import { ArchiveEntryAsyncContentIterator } from './archive-entry-async-content-iterator.ts';

export interface ArchiveEntryOptions {
	header?: TarHeader;
	headerAttributes?: Partial<UstarHeaderLike>;
	headerByteLength?: number;
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
export class ArchiveEntry implements UstarHeaderLike, ArchiveEntryLike, TarSerializable {
	private mHeader: TarHeader;
	private mHeaderByteLength: number;
	private mContent: Uint8Array | null;
	private mOffset: number;
	private mContext: ArchiveContext | null;

	constructor(options: ArchiveEntryOptions = {}) {
		let { header, headerAttributes, headerByteLength, content, offset, context } = options;

		if (!header) header = TarHeader.fromAttributes(headerAttributes || {});
		if (!content) content = null;
		if (!offset) offset = 0;
		if (!context) context = null;

		const contentLength = TarUtility.sizeofUint8Array(content);

		// The fileSize field metadata must always be in sync between the content and the header
		if (!header.pax && header.fileSize !== contentLength && contentLength > 0) {
			header.ustar.fileSize = contentLength;
		}

		// run this last since toUint8Array() also syncs checksums
		if (!headerByteLength) headerByteLength = header.toUint8Array().byteLength;

		this.mHeader = header;
		this.mHeaderByteLength = headerByteLength;
		this.mContent = content;
		this.mOffset = offset;
		this.mContext = context;
	}

	public static isArchiveEntry(v: any): boolean {
		return !!(v && v instanceof ArchiveEntry);
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
	 * If you are attempting to read the content of this entry,
	 * do not modify this instance.
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
	public get sourceOffset(): number {
		return this.mOffset;
	}

	/**
	 * The size in bytes of the header in the source buffer that this entry was parsed from.
	 * Returns zero by default if this was not parsed by a source buffer.
	 */
	public get sourceHeaderByteLength(): number {
		return this.mHeaderByteLength;
	}

	/**
	 * The context (if any) from which this entry was parsed.
	 * The context will include global data about things such as
	 * the origin of the archive and global pax headers.
	 */
	public get sourceContext(): ArchiveContext | null | undefined {
		return this.mContext;
	}

	public isDirectory(): boolean {
		return this.header.isDirectoryHeader;
	}

	public isFile(): boolean {
		return this.header.isFileHeader;
	}

	/**
	 * Convenience for decoding the current content buffer as a string.
	 * Note that if the content was not loaded for whatever reason, this
	 * will return an empty string.
	 * @returns The decoded string data from the currently assigned content,
	 * or an empty string if there is no content assigned.
	 */
	public text(): string {
		return TarUtility.decodeString(this.content!);
	}

	/**
	 * Builds on top of `readNextContentChunk()` and creates an async iterator
	 * to consume these data chunks from.
	 *
	 * @returns an async iterator to consume file content chunks from
	 */
	public getContentChunks(): ArchiveEntryAsyncContentIterator {
		return new ArchiveEntryAsyncContentIterator(this);
	}

	/**
	 * Reads the next chunk of data for the content of this entry from
	 * the assigned source context.
	 *
	 * This is only applicable in async contexts, where the entry content
	 * is not already available via the `content` property.
	 *
	 * @returns The next byte array chunk if one exists, or null if there are no content bytes left
	 * (or the current source context is out of range of this entry)
	 */
	public async readNextContentChunk(): Promise<Uint8Array | null> {
		return this.sourceContext?.tryLoadNextEntryContentChunk(this) ?? null;
	}

	/**
	 * Only necessary if this entry was extracted from an async buffer, since the entry
	 * does not hold the content of async buffers by default.
	 *
	 * If the entry was extracted synchronously, its content will be available via the "content" property.
	 *
	 * Do not use this on entries that have not been parsed from a source buffer,
	 * otherwise it will very likely return garbage data.
	 *
	 * Prefer to use `readNextContentChunk` over this when possible, as using this during
	 * archive read iteration can cause double-loading of the same data and reduce performance.
	 *
	 * @param buffer - the source to read content from
	 * @param offset - the _relative_ offset of the content to read;
	 * 					setting this to 42 will start reading at the 42nd byte index within the content block
	 * @param length - the number of bytes to read after the offset
	 */
	public async readContentFrom(
		buffer: AsyncUint8ArrayLike,
		offset: number = 0,
		length: number = 0,
	): Promise<Uint8Array> {
		const fileSize = this.fileSize;
		const contentStartIndex = this.sourceOffset + this.sourceHeaderByteLength;
		const contentEndIndex = contentStartIndex + fileSize;
		const absoluteOffset = contentStartIndex + TarUtility.clamp(offset, 0, fileSize);
		const bytesRemaining = Math.max(0, contentEndIndex - absoluteOffset);
		const normalizedLength = length > 0 ? Math.min(length, bytesRemaining) : bytesRemaining;
		return buffer.read(absoluteOffset, normalizedLength);
	}

	/**
	 * @returns This instance serialized as a single slice for a tar buffer
	 */
	public toUint8Array(): Uint8Array {
		const headerBytes = this.header.toUint8Array();
		const contentLength = this.content?.byteLength ?? 0;
		const outputLength = TarUtility.roundUpSectorOffset(headerBytes.byteLength + contentLength);
		const result = new Uint8Array(outputLength);

		result.set(headerBytes, 0);

		if (contentLength > 0) {
			result.set(this.content!, headerBytes.byteLength);
		}

		return result;
	}

	/**
	 * Overridden to prevent circular reference errors / huge memory spikes that would
	 * include the underlying content by default.
	 */
	public toJSON(): Record<string, unknown> {
		const {
			header,
			fileName: name,
			fileSize: size,
			content,
			sourceOffset: offset,
			sourceHeaderByteLength
		} = this;

		const isFile = this.isFile();
		const isDirectory = this.isDirectory();
		const type = isFile ? 'file' : isDirectory ? 'directory' : 'complex';
		const contentType = content ? 'Uint8Array[' + content.byteLength + ']' : 'null';
		const byteLength = sourceHeaderByteLength + size;

		return {
			name,
			size,
			type,
			offset,
			byteLength,
			header,
			contentType,
			content: TarUtility.getDebugHexString(content),
		};
	}
}
