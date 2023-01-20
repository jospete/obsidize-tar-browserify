import { AsyncUint8Array } from '../common/async-uint8array';
import { HEADER_SIZE } from '../common/constants';
import { clamp, decodeString, roundUpSectorOffset } from '../common/transforms';
import { TarHeader } from '../header/tar-header';
import {
	isTarHeaderLinkIndicatorTypeDirectory,
	isTarHeaderLinkIndicatorTypeFile,
	TarHeaderLinkIndicatorType
} from '../header/tar-header-link-indicator-type';
import { TarHeaderMetadata } from '../header/tar-header-metadata';
import { TarEntryAttributes, TarEntryAttributesLike } from './tar-entry-attributes';
import { TarEntryMetadata, TarEntryMetadataLike } from './tar-entry-metadata';

/**
 * Container for metadata and content of a tarball entry.
 * 
 * Here, we consider an "entry" to be a tuple of:
 * 1. The parsed USTAR header sector content (AKA TarHeader)
 * 2. The aggregate of the proceeding file content sectors, based on the header's file size attribute
 */
export class TarEntry implements TarHeader {

	protected readonly metadata: TarEntryMetadata;

	constructor(
		metadata: TarEntryMetadataLike
	) {
		this.metadata = TarEntryMetadata.from(metadata);
	}

	public static isTarEntry(v: any): boolean {
		return !!(v && v instanceof TarEntry);
	}

	public static from(attrs: Partial<TarHeader>, content: Uint8Array | null = null): TarEntry {
		const header = new TarHeaderMetadata(attrs);
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

	// =================================================================
	// TarHeader Interface Fields
	// =================================================================

	public get fileName(): string {
		return this.header.fileName.value;
	}

	public set fileName(value: string) {
		this.header.fileName.value = value;
	}

	public get fileSize(): number {
		return this.header.fileSize.value;
	}

	public set fileSize(value: number) {
		this.header.fileSize.value = value;
	}

	public get fileMode(): number {
		return this.header.fileMode.value;
	}

	public set fileMode(value: number) {
		this.header.fileMode.value = value;
	}

	public get ownerUserId(): number {
		return this.header.ownerUserId.value;
	}

	public set ownerUserId(value: number) {
		this.header.ownerUserId.value = value;
	}

	public get groupUserId(): number {
		return this.header.groupUserId.value;
	}

	public set groupUserId(value: number) {
		this.header.groupUserId.value = value;
	}

	public get lastModified(): number {
		return this.header.lastModified.value;
	}

	public set lastModified(value: number) {
		this.header.lastModified.value = value;
	}

	public get headerChecksum(): number {
		return this.header.headerChecksum.value;
	}

	public get linkedFileName(): string {
		return this.header.linkedFileName.value;
	}

	public set linkedFileName(value: string) {
		this.header.linkedFileName.value = value;
	}

	public get typeFlag(): TarHeaderLinkIndicatorType {
		return this.header.typeFlag.value;
	}

	public set typeFlag(value: TarHeaderLinkIndicatorType) {
		this.header.typeFlag.value = value;
	}

	public get ustarIndicator(): string {
		return this.header.ustarIndicator.value;
	}

	public get ustarVersion(): string {
		return this.header.ustarVersion.value;
	}

	public set ustarVersion(value: string) {
		this.header.ustarVersion.value = value;
	}

	public get ownerUserName(): string {
		return this.header.ownerUserName.value;
	}

	public set ownerUserName(value: string) {
		this.header.ownerUserName.value = value;
	}

	public get ownerGroupName(): string {
		return this.header.ownerGroupName.value;
	}

	public set ownerGroupName(value: string) {
		this.header.ownerGroupName.value = value;
	}

	public get deviceMajorNumber(): string {
		return this.header.deviceMajorNumber.value;
	}

	public set deviceMajorNumber(value: string) {
		this.header.deviceMajorNumber.value = value;
	}

	public get deviceMinorNumber(): string {
		return this.header.deviceMinorNumber.value;
	}

	public set deviceMinorNumber(value: string) {
		this.header.deviceMinorNumber.value = value;
	}

	public get fileNamePrefix(): string {
		return this.header.fileNamePrefix.value;
	}

	public set fileNamePrefix(value: string) {
		this.header.fileNamePrefix.value = value;
	}

	// =================================================================
	// Introspection Fields
	// =================================================================

	/**
	 * The header metadata parsed out for this entry.
	 * See TarHeaderFieldDefinition for details.
	 */
	public get header(): TarHeaderMetadata {
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
		return HEADER_SIZE + this.fileSize;
	}

	/**
	 * The total byte length of this entry, including the header, 
	 * which is a multiple of the standard tar sector size.
	 */
	public get sectorByteLength(): number {
		return roundUpSectorOffset(this.byteLength);
	}

	/**
	 * The starting index (inclusive) of the content of this entry.
	 * Note that this will always be the first index of the header, regardless of
	 * whether or not this is a file.
	 */
	public get contentStartIndex(): number {
		return HEADER_SIZE + this.bufferStartIndex;
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
		return decodeString(this.content!);
	}

	public isDirectory(): boolean {
		return isTarHeaderLinkIndicatorTypeDirectory(this.typeFlag);
	}

	public isFile(): boolean {
		return isTarHeaderLinkIndicatorTypeFile(this.typeFlag);
	}

	/**
	 * Only necessary if this entry was extracted from an async buffer, since the entry
	 * does not hold the content of async buffers by default.
	 * 
	 * If the entry was extracted synchronously, its content will be available via the "content" property.
	 */
	public async readContentFrom(buffer: AsyncUint8Array, offset: number = 0, length: number = 0): Promise<Uint8Array> {
		const { contentStartIndex, contentEndIndex, fileSize } = this;
		const normalizedOffset = clamp(offset, 0, fileSize) + contentStartIndex;
		const bytesRemaining = Math.max(0, contentEndIndex - normalizedOffset);
		const normalizedLength = length > 0 ? Math.min(length, bytesRemaining) : bytesRemaining;
		return buffer.read(normalizedOffset, normalizedLength);
	}

	public toAttributes(): TarEntryAttributes {
		return new TarEntryAttributes(this.header.deflate(), this.content);
	}

	public toUint8Array(): Uint8Array {
		return this.toAttributes().toUint8Array();
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