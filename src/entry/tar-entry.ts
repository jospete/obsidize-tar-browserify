import {
	AsyncUint8Array,
	clamp,
	decodeString,
	isDefined,
	roundUpSectorOffset
} from '../common';

import {
	TarHeader,
	TarHeaderUtility,
	TarHeaderLinkIndicatorType,
	isTarHeaderLinkIndicatorTypeDirectory,
	isTarHeaderLinkIndicatorTypeFile,
	TarHeaderFieldExtractionResult,
	TarHeaderExtractionResult
} from '../header';

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
		const header = TarHeaderUtility.expandHeaderToExtractionResult(attrs);
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
		return this.getParsedHeaderFieldValue('fileName', '');
	}

	public set fileName(value: string) {
		this.setParsedHeaderFieldValue('fileName', value);
	}

	public get fileSize(): number {
		return this.getParsedHeaderFieldValue('fileSize', 0);
	}

	public set fileSize(value: number) {
		this.setParsedHeaderFieldValue('fileSize', value);
	}

	public get fileMode(): number {
		return this.getParsedHeaderFieldValue('fileMode', 0);
	}

	public set fileMode(value: number) {
		this.setParsedHeaderFieldValue('fileMode', value);
	}

	public get ownerUserId(): number {
		return this.getParsedHeaderFieldValue('ownerUserId', 0);
	}

	public set ownerUserId(value: number) {
		this.setParsedHeaderFieldValue('ownerUserId', value);
	}

	public get groupUserId(): number {
		return this.getParsedHeaderFieldValue('groupUserId', 0);
	}

	public set groupUserId(value: number) {
		this.setParsedHeaderFieldValue('groupUserId', value);
	}

	public get lastModified(): number {
		return this.getParsedHeaderFieldValue('lastModified', 0);
	}

	public set lastModified(value: number) {
		this.setParsedHeaderFieldValue('lastModified', value);
	}

	public get headerChecksum(): number {
		return this.getParsedHeaderFieldValue('headerChecksum', 0);
	}

	public get linkedFileName(): string {
		return this.getParsedHeaderFieldValue('linkedFileName', '');
	}

	public set linkedFileName(value: string) {
		this.setParsedHeaderFieldValue('linkedFileName', value);
	}

	public get typeFlag(): TarHeaderLinkIndicatorType {
		return this.getParsedHeaderFieldValue('typeFlag', TarHeaderLinkIndicatorType.UNKNOWN);
	}

	public set typeFlag(value: TarHeaderLinkIndicatorType) {
		this.setParsedHeaderFieldValue('typeFlag', value);
	}

	public get ustarIndicator(): string {
		return this.getParsedHeaderFieldValue('ustarIndicator', '');
	}

	public get ustarVersion(): string {
		return this.getParsedHeaderFieldValue('ustarVersion', '');
	}

	public set ustarVersion(value: string) {
		this.setParsedHeaderFieldValue('ustarVersion', value);
	}

	public get ownerUserName(): string {
		return this.getParsedHeaderFieldValue('ownerUserName', '');
	}

	public set ownerUserName(value: string) {
		this.setParsedHeaderFieldValue('ownerUserName', value);
	}

	public get ownerGroupName(): string {
		return this.getParsedHeaderFieldValue('ownerGroupName', '');
	}

	public set ownerGroupName(value: string) {
		this.setParsedHeaderFieldValue('ownerGroupName', value);
	}

	public get deviceMajorNumber(): string {
		return this.getParsedHeaderFieldValue('deviceMajorNumber', '');
	}

	public set deviceMajorNumber(value: string) {
		this.setParsedHeaderFieldValue('deviceMajorNumber', value);
	}

	public get deviceMinorNumber(): string {
		return this.getParsedHeaderFieldValue('deviceMinorNumber', '');
	}

	public set deviceMinorNumber(value: string) {
		this.setParsedHeaderFieldValue('deviceMinorNumber', value);
	}

	public get fileNamePrefix(): string {
		return this.getParsedHeaderFieldValue('fileNamePrefix', '');
	}

	public set fileNamePrefix(value: string) {
		this.setParsedHeaderFieldValue('fileNamePrefix', value);
	}

	// =================================================================
	// Introspection Fields
	// =================================================================

	/**
	 * The header metadata parsed out for this entry.
	 * See TarHeaderFieldDefinition for details.
	 */
	public get header(): TarHeaderExtractionResult {
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
		return TarHeaderUtility.HEADER_SIZE + this.fileSize;
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
		return TarHeaderUtility.HEADER_SIZE + this.bufferStartIndex;
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

	public getHeaderFieldMetadata<T>(key: keyof TarHeader): TarHeaderFieldExtractionResult<T> | undefined {
		return (this.header as any)[key];
	}

	public getParsedHeaderFieldValue<T>(key: keyof TarHeader, defaultValue?: T): T {
		const metadata = this.getHeaderFieldMetadata(key);
		return (metadata && isDefined(metadata.value)
			? metadata.value
			: defaultValue) as T;
	}

	public setParsedHeaderFieldValue<T>(key: keyof TarHeader, value: T): void {
		const metadata = this.getHeaderFieldMetadata(key);
		if (metadata) metadata.value = value;
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

	public toUint8Array(): Uint8Array {
		return this.toAttributes().toUint8Array();
	}

	public toAttributes(): TarEntryAttributes {
		return new TarEntryAttributes(
			TarHeaderUtility.flattenHeaderExtractionResult(this.header),
			this.content
		);
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