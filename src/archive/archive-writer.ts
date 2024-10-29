import { TarUtility } from '../common/tar-utility';
import { TarEntry } from '../entry/tar-entry';
import { TarHeaderLike } from '../header/tar-header-like';
import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';

/**
 * Generic utility for building a tar octet stream by adding JSON-style entries.
 * See the `add***()` options in this class definition for details.
 */
export class ArchiveWriter {
	public entries: TarEntry[] = [];
	
	/**
	 * @returns a complete tar buffer from all the currently set tar entries in this instance.
	 */
	public toUint8Array(): Uint8Array {
		return TarEntry.serialize(this.entries);
	}

	/**
	 * Convenience for appending a new entry to the existing `entries` array
	 * @returns `this` for operation chaining
	 */
	public addEntry(entry: TarEntry): this {
		this.entries.push(entry);
		return this;
	}

	/**
	 * Convenience for appending a new entry to the existing `entries` array.
	 * Uses `TarEntry.from()` on the given parameters to create the entry.
	 * @returns `this` for operation chaining
	 */
	public addEntryWith(header: TarHeaderLike | Partial<TarHeaderLike>, content?: Uint8Array): this {
		return this.addEntry(TarEntry.from(header, content));
	}

	/**
	 * Convenience option for building tarball data
	 * @param path - the file name, e.g. './relative/path/to/your/file.txt'
	 * @param content - the content of the file (shocker!)
	 * @param headerOptions - custom options for this entry
	 * @returns `this` for operation chaining
	 */
	public addTextFile(path: string, content: string, headerOptions?: Partial<TarHeaderLike>): this {
		return this.addBinaryFile(
			path, 
			TarUtility.encodeString(content), 
			headerOptions
		);
	}

	/**
	 * Convenience option for building tarball data
	 * @param path - the file name, e.g. './relative/path/to/your/file.bin'
	 * @param content - the content of the file (shocker!)
	 * @param headerOptions - custom options for this entry
	 * @returns `this` for operation chaining
	 */
	public addBinaryFile(path: string, content: Uint8Array, headerOptions: Partial<TarHeaderLike> = {}): this {
		const combinedHeaderOptions = Object.assign({
			fileName: path,
			fileSize: content.byteLength,
			typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE
		}, headerOptions);
		return this.addEntryWith(combinedHeaderOptions, content);
	}

	/**
	 * Convenience option for building tarball data
	 * @param path - the directory name, e.g. './relative/path/to/your/dir'
	 * @param headerOptions - custom options for this entry
	 * @returns `this` for operation chaining
	 */
	public addDirectory(path: string, headerOptions: Partial<TarHeaderLike> = {}): this {
		const combinedHeaderOptions = Object.assign({
			fileName: path,
			typeFlag: TarHeaderLinkIndicatorType.DIRECTORY
		}, headerOptions);
		return this.addEntryWith(combinedHeaderOptions);
	}
}