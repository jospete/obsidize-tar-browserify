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

	public getHeaderField(key: keyof TarHeader, defaultValue?: any): any {
		return (this.header && key in this.header)
			? (this.header as any)[key]
			: defaultValue;
	}

	public getType(): TarHeaderLinkIndicatorType {
		return this.getHeaderField('typeFlag', TarHeaderLinkIndicatorType.UNKNOWN);
	}

	public getTrimmedFileName(): string {
		return this.header.fileName.replace(/\0+$/, '');
	}

	public isDirectory(): boolean {
		return this.getType() === TarHeaderLinkIndicatorType.DIRECTORY;
	}

	public isFile(): boolean {
		const flag = this.getType();
		switch (flag) {
			case TarHeaderLinkIndicatorType.NORMAL_FILE:
			case TarHeaderLinkIndicatorType.CONTIGUOUS_FILE:
				return true;
			default:
				return false;
		}
	}
}