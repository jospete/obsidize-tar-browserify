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

import { TarUtility } from '../tar-utility';

/**
 * Container for metadata and content of a tarball entry.
 * 
 * Here, we consider an "entry" to be a tuple of:
 * 1. The parsed USTAR header sector content (AKA TarHeader)
 * 2. The aggregate of the proceeding file content sectors, based on the header's file size attribute
 * 
 * NOTE: You can extract instances of this from raw Uint8Array instances using extractTarEntry()
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

	public static tryParse(input: Uint8Array, offset?: number): TarEntry | null {
		const metadata = TarEntryUtility.extractEntryMetadata(input, offset);
		return metadata ? new TarEntry(metadata) : null;
	}

	public static from(attrs: Partial<TarHeader>, content: Uint8Array | null = null): TarEntry {
		const header = TarHeaderUtility.expandHeaderToExtractionResult(attrs);
		return new TarEntry({ header, content });
	}

	public get header(): TarHeaderExtractionResult {
		return this.metadata.header;
	}

	public get content(): Uint8Array | null | undefined {
		return this.metadata.content;
	}

	public get contentByteLength(): number {
		return TarUtility.sizeofUint8Array(this.content);
	}

	public get byteLength(): number {
		return TarHeaderUtility.HEADER_SIZE + this.contentByteLength;
	}

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