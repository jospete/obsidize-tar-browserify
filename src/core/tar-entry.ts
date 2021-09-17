import { TarHeader, TarHeaderLinkIndicatorType } from './tar-header';

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
		public readonly header: TarHeader,
		public readonly content: Uint8Array | null = null
	) {
	}

	public get fileName(): string {
		return this.getHeaderField('fileName', '');
	}

	public getHeaderField(key: keyof TarHeader, defaultValue?: any): any {
		return (this.header && this.header.hasOwnProperty(key))
			? (this.header as any)[key]
			: defaultValue;
	}

	public getType(): TarHeaderLinkIndicatorType {
		return this.getHeaderField('typeFlag', TarHeaderLinkIndicatorType.UNKNOWN);
	}

	public isDirectory(): boolean {
		return this.getType() === TarHeaderLinkIndicatorType.DIRECTORY;
	}

	public isFile(): boolean {
		const flag = this.getType();
		switch (flag) {
			case TarHeaderLinkIndicatorType.NORMAL_FILE:
			case TarHeaderLinkIndicatorType.NORMAL_FILE_ALT1:
			case TarHeaderLinkIndicatorType.NORMAL_FILE_ALT2:
			case TarHeaderLinkIndicatorType.CONTIGUOUS_FILE:
				return true;
			default:
				return false;
		}
	}

	public toJSON(): any {

		const { header } = this;
		const isFile = this.isFile();
		const isDirectory = this.isDirectory();
		const content = this.content
			? ('Uint8Array(' + this.content.byteLength + ')')
			: 'null';

		return { content, isFile, isDirectory, header };
	}
}