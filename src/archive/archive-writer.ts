import { Constants } from '../common/constants';
import { TarSerializable, TarUtility } from '../common/tar-utility';
import { TarEntry } from '../entry/tar-entry';
import { UstarHeaderLike } from '../header/ustar/ustar-header-like';
import { UstarHeaderLinkIndicatorType } from '../header/ustar/ustar-header-link-indicator-type';

export type TarEntryPredicate = (entry: TarEntry) => boolean;

/**
 * Generic utility for building a tar octet stream by adding JSON-style entries.
 * See the `add***()` options in this class definition for details.
 */
export class ArchiveWriter implements TarSerializable {
	constructor(
		public entries: TarEntry[] = []
	) {	
	}

	/**
	 * Combines the given array of entries into a single, complete tarball buffer
	 */
	public static serialize(entries: TarEntry[]): Uint8Array {
		let outputLength = Constants.TERMINAL_PADDING_SIZE;
		const outputBuffers: Uint8Array[] = [];

		for (const entry of entries) {
			const entryBytes = entry.toUint8Array();
			outputBuffers.push(entryBytes);
			outputLength += entryBytes.byteLength;
		}

		const output = new Uint8Array(outputLength);
		let offset = 0;

		for (const entryBuf of outputBuffers) {
			output.set(entryBuf, offset);
			offset += entryBuf.byteLength;
		}

		return output;
	}
	
	/**
	 * @returns a complete tar buffer from all the currently set tar entries in this instance.
	 */
	public toUint8Array(): Uint8Array {
		return ArchiveWriter.serialize(this.entries);
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
	 * @returns `this` for operation chaining
	 */
	public addEntryWith(header: UstarHeaderLike | Partial<UstarHeaderLike>, content?: Uint8Array): this {
		return this.addEntry(TarEntry.from(header, content));
	}

	/**
	 * Convenience option for building tarball data
	 * @param path - the file name, e.g. './relative/path/to/your/file.txt'
	 * @param content - the content of the file (shocker!)
	 * @param headerOptions - custom options for this entry
	 * @returns `this` for operation chaining
	 */
	public addTextFile(path: string, content: string, headerOptions?: Partial<UstarHeaderLike>): this {
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
	public addBinaryFile(path: string, content: Uint8Array, headerOptions: Partial<UstarHeaderLike> = {}): this {
		const combinedHeaderOptions = Object.assign({
			fileName: path,
			fileSize: content.byteLength,
			typeFlag: UstarHeaderLinkIndicatorType.NORMAL_FILE
		}, headerOptions);
		return this.addEntryWith(combinedHeaderOptions, content);
	}

	/**
	 * Convenience option for building tarball data
	 * @param path - the directory name, e.g. './relative/path/to/your/dir'
	 * @param headerOptions - custom options for this entry
	 * @returns `this` for operation chaining
	 */
	public addDirectory(path: string, headerOptions: Partial<UstarHeaderLike> = {}): this {
		const combinedHeaderOptions = Object.assign({
			fileName: path,
			typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY
		}, headerOptions);
		return this.addEntryWith(combinedHeaderOptions);
	}

	/**
	 * Removes any entries from this writer's cache that meet the given predicate condition.
	 * @param predicate - delegate that will return true for any entry that should be removed.
	 * @returns `this` for operation chaining
	 */
	public removeEntriesWhere(predicate: TarEntryPredicate): this {
		this.entries = this.entries.filter((v) => !predicate(v));
		return this;
	}

	/**
	 * Convenience option for cleaning the header of each listed entry.
	 * When headers are "cleaned", unknown PAX properties will be removed
	 * (e.g. unwanted MacOS "quarantine" headers), and USTAR fields
	 * will be normalized (if necessary).
	 */
	public cleanAllHeaders(): this {
		for (const entry of this.entries) {
			entry.header.clean();
		}
		return this;
	}
}