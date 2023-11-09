import { AsyncUint8Array } from '../common/async-uint8array';
import { TarUtility } from '../common/tar-utility';
import { AsyncTarEntryIterator, TarEntryDelegate } from '../entry/async-tar-entry-iterator';
import { TarEntry } from '../entry/tar-entry';
import { TarEntryIterator } from '../entry/tar-entry-iterator';
import { TarHeaderLike } from '../header/tar-header-like';
import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';

/**
 * Main entry point for extracting and creating tarballs.
 * See TarIterator and TarEntry for more granular options.
 */
export class Tarball {

	public entries: TarEntry[] = [];

	/**
	 * Creates a new tarball instance that can be used
	 * to build a tar buffer from any of the `add***()` methods
	 * @param inputBuffer - if provided, initializes the instance's
	 * 		`entries` array to the tar entries parsed from this buffer.
	 * 		Useful if you want to open a tarball, add to it, and then close it back up.
	 */
	constructor(inputBuffer?: Uint8Array) {
		if (TarUtility.isUint8Array(inputBuffer)) {
			this.setBuffer(inputBuffer!);
		}
	}

	/**
	 * Parses a set of TarEntry instances from the given buffer.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static extract(buffer: Uint8Array): TarEntry[] {
		return TarEntryIterator.extractAll(buffer);
	}

	/**
	 * Parses a set of TarEntry instances from the given async buffer.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static async extractAsync(
		buffer: AsyncUint8Array
	): Promise<TarEntry[]> {
		return AsyncTarEntryIterator.extractAll(buffer);
	}

	/**
	 * Step through entries as they are parsed from the source.
	 * Does not collect entries into an array, and is generally more
	 * memory-friendly.
	 */
	public static async streamAsync(
		buffer: AsyncUint8Array,
		onNext: TarEntryDelegate
	): Promise<void> {
		return AsyncTarEntryIterator.forEachIn(buffer, onNext);
	}

	/**
	 * @returns a complete tar buffer from all the currently set tar entries in this instance.
	 */
	public toUint8Array(): Uint8Array {
		return TarEntry.combinePaddedFrom(this.entries);
	}

	/**
	 * @param buffer - the tarball to parse and set our entry list to.
	 * @returns `this` for operation chaining
	 */
	public setBuffer(buffer: Uint8Array): this {
		this.entries = Tarball.extract(buffer);
		return this;
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