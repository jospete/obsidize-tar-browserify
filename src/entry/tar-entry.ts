import { AsyncUint8Array } from '../common/async-uint8array';
import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeader } from '../header/tar-header';
import { TarHeaderLike } from '../header/tar-header-like';
import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';
import { TarHeaderUtility } from '../header/tar-header-utility';
import { TarEntryAttributes, TarEntryAttributesLike } from './tar-entry-attributes';
import { TarEntryMetadata, TarEntryMetadataLike } from './tar-entry-metadata';

/**
 * Container for metadata and content of a tarball entry.
 * 
 * Here, we consider an "entry" to be a tuple of:
 * 1. The parsed USTAR header sector content (AKA TarHeader)
 * 2. The aggregate of the proceeding file content sectors, based on the header's file size attribute
 */
export class TarEntry implements TarHeaderLike {

	protected readonly metadata: TarEntryMetadata;

	constructor(
		metadata: TarEntryMetadataLike
	) {
		this.metadata = TarEntryMetadata.from(metadata);
	}

	public static isTarEntry(v: any): boolean {
		return !!(v && v instanceof TarEntry);
	}

	public static from(attrs: TarHeaderLike | Partial<TarHeaderLike>, content: Uint8Array | null = null): TarEntry {
		const header = TarHeader.from(attrs);
		return new TarEntry({ header, content, offset: 0 });
	}

	public static fromAttributes(attrs: TarEntryAttributesLike): TarEntry {
		const { header, content } = attrs;
		return TarEntry.from(header, content);
	}

	public static tryParse(input: Uint8Array, offset?: number): TarEntry | null {
		const metadata = TarEntryMetadata.extractFrom(input, offset);
		return metadata ? new TarEntry(metadata) : null;
	}

	public static async tryParseAsync(input: AsyncUint8Array, offset?: number): Promise<TarEntry | null> {
		const metadata = await TarEntryMetadata.extractFromAsync(input, offset);
		return metadata ? new TarEntry(metadata) : null;
	}

	public static combinePaddedFrom(entries: TarEntry[]): Uint8Array {

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
		return this.metadata.header;
	}

	/**
	 * The file content for this entry.
	 * This may be null for entries loaded asynchronously, or
	 * for non-file entries like directories.
	 */
	public get content(): Uint8Array | null | undefined {
		return this.metadata.content;
	}

	/**
	 * The starting absolute index (inclusive) in the source buffer that this entry was parsed from.
	 * Returns zero by default if this was not parsed by a source buffer.
	 */
	public get bufferStartIndex(): number {
		return this.metadata.offset;
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

	public getContentAsText(): string {
		return TarUtility.decodeString(this.content!);
	}

	public isDirectory(): boolean {
		return TarHeaderUtility.isTarHeaderLinkIndicatorTypeDirectory(this.typeFlag);
	}

	public isFile(): boolean {
		return TarHeaderUtility.isTarHeaderLinkIndicatorTypeFile(this.typeFlag);
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

	public writeTo(output: Uint8Array, offset: number): boolean {

		if (!TarUtility.isUint8Array(output)
			|| output.byteLength < (offset + this.sectorByteLength)) {
			return false;
		}

		const headerBytes = this.header.toUint8Array();

		output.set(headerBytes, offset);
		offset += headerBytes.byteLength;

		if (this.content) {
			output.set(this.content, offset);
		}

		return true;
	}

	public toAttributes(): TarEntryAttributes {
		return new TarEntryAttributes(this.header, this.content);
	}

	public toUint8Array(): Uint8Array {

		const headerBytes = this.header.toUint8Array();
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