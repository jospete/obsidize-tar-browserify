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

	public toUint8Array(): Uint8Array {
		return TarEntry.combinePaddedFrom(this.entries);
	}

	public setBuffer(buffer: Uint8Array): this {
		this.entries = Tarball.extract(buffer);
		return this;
	}

	public addEntry(entry: TarEntry): this {
		this.entries.push(entry);
		return this;
	}

	public addEntryWith(header: TarHeaderLike | Partial<TarHeaderLike>, content?: Uint8Array): this {
		return this.addEntry(TarEntry.from(header, content));
	}

	public addTextFile(path: string, content: string, headerOptions?: Partial<TarHeaderLike>): this {
		return this.addBinaryFile(
			path, 
			TarUtility.encodeString(content), 
			headerOptions
		);
	}

	public addBinaryFile(path: string, content: Uint8Array, headerOptions: Partial<TarHeaderLike> = {}): this {
		const combinedHeaderOptions = Object.assign({
			fileName: path,
			fileSize: content.byteLength,
			typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE
		}, headerOptions);
		return this.addEntryWith(combinedHeaderOptions, content);
	}

	public addDirectory(path: string, headerOptions: Partial<TarHeaderLike> = {}): this {
		const combinedHeaderOptions = Object.assign({
			fileName: path,
			typeFlag: TarHeaderLinkIndicatorType.DIRECTORY
		}, headerOptions);
		return this.addEntryWith(combinedHeaderOptions);
	}
}