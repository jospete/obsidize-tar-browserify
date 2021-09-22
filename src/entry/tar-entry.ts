import {
	TarHeader,
	TarHeaderUtility,
	TarHeaderLinkIndicatorType,
	TarHeaderExtractionResult,
	isTarHeaderLinkIndicatorTypeDirectory,
	isTarHeaderLinkIndicatorTypeFile,
	TarHeaderFieldExtractionResult
} from '../header';

import {
	TarEntryAttributes
} from '../entry';

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
		public readonly header: TarHeaderExtractionResult,
		public readonly content: Uint8Array | null = null
	) {
	}

	public static isTarEntry(v: any): boolean {
		return !!(v && v instanceof TarEntry);
	}

	public static from(header: Partial<TarHeader>, content?: Uint8Array): TarEntry {
		const safeHeader = TarHeaderUtility.expandHeaderToExtractionResult(header);
		return new TarEntry(safeHeader, content);
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