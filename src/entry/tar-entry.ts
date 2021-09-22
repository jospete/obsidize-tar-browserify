import { TarHeaderFieldDefinition, TarHeaderExtractionResult, TarHeader } from '../header';
import { TarEntryUtility } from './tar-entry-utility';

import {
	TarHeaderLinkIndicatorType,
	isTarHeaderLinkIndicatorTypeDirectory,
	isTarHeaderLinkIndicatorTypeFile
} from '../header/tar-header-link-indicator-type';

const { getFieldDefinition } = TarHeaderFieldDefinition;
const { createTarEntryBuffer } = TarEntryUtility;

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

	public get fileName(): string {
		return this.getParsedHeaderFieldValue('fileName', '');
	}

	public get fileSize(): number {
		return this.getParsedHeaderFieldValue('fileSize', 0);
	}

	public getType(): TarHeaderLinkIndicatorType {
		return this.getHeaderFieldValue('typeFlag', TarHeaderLinkIndicatorType.UNKNOWN);
	}

	public isDirectory(): boolean {
		return isTarHeaderLinkIndicatorTypeDirectory(this.getType());
	}

	public isFile(): boolean {
		return isTarHeaderLinkIndicatorTypeFile(this.getType());
	}

	public getHeaderFieldValue(key: keyof TarHeader, defaultValue?: any): any {
		return (this.header && key in this.header)
			? (this.header as any)[key]
			: defaultValue;
	}

	public getParsedHeaderFieldValue(key: keyof TarHeader, defaultValue?: any): any {
		const field = getFieldDefinition(key);
		const rawValue = this.getHeaderFieldValue(key);
		return (field && rawValue) ? parseFieldValue(field, rawValue) : defaultValue;
	}

	public toUint8Array(): Uint8Array {
		return createTarEntryBuffer(this.header, this.content!);
	}

	public toJSON(): any {

		const { header, fileName, fileSize } = this;
		const isFile = this.isFile();
		const isDirectory = this.isDirectory();
		const content = this.content
			? ('Uint8Array(' + this.content.byteLength + ')')
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