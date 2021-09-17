import { TarHeader, TarHeaderLinkIndicatorType } from './tar-header';

/**
 * Extraction result containing the tar header and file content.
 * Note that the content may be null if the header file size is not a positive integer.
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