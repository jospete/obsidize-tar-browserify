import { TarHeader } from './tar-header';

/**
 * Extraction result containing the tar header and file content.
 * Note that the content may be null if the header file size is not a positive integer.
 */
export class TarEntry {

	constructor(
		public readonly header: TarHeader,
		public readonly content: Uint8Array | null
	) {
	}

	public getHeaderField<T>(key: keyof TarHeader, defaultValue?: T): T | undefined {
		return this.header ? (this.header as any)[key] as T : defaultValue;
	}
}