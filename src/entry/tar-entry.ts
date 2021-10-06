import { TarUtility, AsyncUint8Array } from '../common';

import {
	TarHeader,
	TarHeaderUtility,
	TarHeaderLinkIndicatorType,
	isTarHeaderLinkIndicatorTypeDirectory,
	isTarHeaderLinkIndicatorTypeFile,
	TarHeaderFieldExtractionResult,
	TarHeaderExtractionResult
} from '../header';

import {
	TarEntryUtility,
	TarEntryAttributes,
	TarEntryMetadata
} from './tar-entry-utility';

/**
 * Container for metadata and content of a tarball entry.
 * 
 * Here, we consider an "entry" to be a tuple of:
 * 1. The parsed USTAR header sector content (AKA TarHeader)
 * 2. The aggregate of the proceeding file content sectors, based on the header's file size attribute
 */
export class TarEntry {

	protected readonly metadata: TarEntryMetadata;

	constructor(
		metadata: TarEntryMetadata
	) {
		this.metadata = TarEntryUtility.sanitizeTarEntryMetadata(metadata);
	}

	public static isTarEntry(v: any): boolean {
		return !!(v && v instanceof TarEntry);
	}

	public static from(attrs: Partial<TarHeader>, content: Uint8Array | null = null): TarEntry {
		const header = TarHeaderUtility.expandHeaderToExtractionResult(attrs);
		return new TarEntry({ header, content, offset: 0 });
	}

	public static tryParse(input: Uint8Array, offset?: number): TarEntry | null {
		const metadata = TarEntryUtility.extractEntryMetadata(input, offset);
		return metadata ? new TarEntry(metadata) : null;
	}

	public static async tryParseAsync(input: AsyncUint8Array, offset?: number): Promise<TarEntry | null> {
		const metadata = await TarEntryUtility.extractEntryMetadataAsync(input, offset);
		return metadata ? new TarEntry(metadata) : null;
	}

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
		return TarUtility.roundUpSectorOffset(this.byteLength);
	}

	public get fileName(): string {
		return this.getParsedHeaderFieldValue('fileName', '');
	}

	public get fileSize(): number {
		return this.getParsedHeaderFieldValue('fileSize', 0);
	}

	public getType(): TarHeaderLinkIndicatorType {
		return this.getParsedHeaderFieldValue('typeFlag', TarHeaderLinkIndicatorType.UNKNOWN);
	}

	public isDirectory(): boolean {
		return isTarHeaderLinkIndicatorTypeDirectory(this.getType());
	}

	public isFile(): boolean {
		return isTarHeaderLinkIndicatorTypeFile(this.getType());
	}

	public getHeaderFieldMetadata<T>(key: keyof TarHeader): TarHeaderFieldExtractionResult<T> | undefined {
		return (this.header as any)[key];
	}

	public getParsedHeaderFieldValue<T>(key: keyof TarHeader, defaultValue?: T): T {
		const metadata = this.getHeaderFieldMetadata(key);
		return (metadata && TarUtility.isDefined(metadata.value)
			? metadata.value
			: defaultValue) as T;
	}

	public toUint8Array(): Uint8Array {
		return TarEntryUtility.generateEntryBuffer(this.toAttributes())!;
	}

	public toAttributes(): TarEntryAttributes {
		return {
			header: TarHeaderUtility.flattenHeaderExtractionResult(this.header),
			content: this.content
		};
	}

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