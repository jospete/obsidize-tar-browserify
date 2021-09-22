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
 * 
 * NOTE: You can extract instances of this from raw Uint8Array instances using extractTarEntry()
 */
export class TarEntry {

	constructor(
		protected readonly metadata: TarEntryMetadata
	) {
	}

	public static isTarEntry(v: any): boolean {
		return !!(v && v instanceof TarEntry);
	}

	public static from(attrs: Partial<TarHeader>, content?: Uint8Array): TarEntry {
		const header = TarHeaderUtility.expandHeaderToExtractionResult(attrs);
		return new TarEntry({ header, content });
	}

	public static tryParse(input: Uint8Array, offset?: number): TarEntry | null {
		const metadata = TarEntryUtility.extractEntryMetadata(input, offset);
		return metadata ? new TarEntry(metadata) : null;
	}

	public get header(): TarHeaderExtractionResult {
		return this.metadata.header;
	}

	public get content(): Uint8Array | null | undefined {
		return this.metadata.content;
	}

	public get startOffset(): number {
		return this.metadata.start!;
	}

	public get endOffset(): number {
		return this.metadata.end!;
	}

	public get byteLength(): number {
		return this.endOffset - this.startOffset;
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

	public getParsedHeaderFieldValue<T>(key: keyof TarHeader, defaultValue?: T): T {
		const metadata = this.getHeaderFieldMetadata(key);
		return (metadata ? metadata.value : defaultValue) as T;
	}

	public getHeaderFieldMetadata<T>(key: keyof TarHeader): TarHeaderFieldExtractionResult<T> | undefined {
		return (this.header && key in this.header)
			? (this.header as any)[key]
			: undefined;
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