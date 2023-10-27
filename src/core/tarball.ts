import { AsyncUint8Array } from '../common/async-uint8array';
import { TarUtility } from '../common/tar-utility';
import { AsyncTarEntryIterator, TarEntryDelegate } from '../entry/async-tar-entry-iterator';
import { TarEntry } from '../entry/tar-entry';
import { TarEntryAttributes, TarEntryAttributesLike } from '../entry/tar-entry-attributes';
import { TarEntryIterator } from '../entry/tar-entry-iterator';
import { TarHeader } from '../header/tar-header';
import { TarHeaderLinkIndicatorType } from '../header/tar-header-link-indicator-type';

/**
 * Main entry point for extracting and creating tarballs.
 * See TarIterator and TarEntry for more granular options.
 */
export class Tarball {

	public entries: TarEntry[] = [];

	/**
	 * Parses a set of TarEntry instances from the given buffer.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static extract(buffer: Uint8Array): TarEntry[] {
		return TarEntryIterator.extractAll(buffer);
	}

	/**
	 * Generates a tar file buffer from the given attributes list.
	 */
	public static create(entries: TarEntryAttributesLike[]): Uint8Array {
		return TarEntryAttributes.combinePaddedFrom(entries);
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
		const attrs = Array.from(this.entries).map(e => e.toAttributes());
		return Tarball.create(attrs);
	}

	public setBuffer(buffer: Uint8Array): this {
		this.entries = Tarball.extract(buffer);
		return this;
	}

	public add(attrs: TarEntryAttributesLike): this {
		this.entries.push(TarEntry.fromAttributes(attrs));
		return this;
	}

	public addTextFile(path: string, content: string, headerOptions?: Partial<TarHeader>): this {
		return this.addBinaryFile(path, TarUtility.encodeString(content), headerOptions);
	}

	public addBinaryFile(path: string, content: Uint8Array, headerOptions: Partial<TarHeader> = {}): this {
		return this.add({
			header: Object.assign({
				fileName: path,
				fileSize: content.byteLength,
				typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE
			}, headerOptions),
			content
		});
	}

	public addDirectory(path: string, headerOptions: Partial<TarHeader> = {}): this {
		return this.add({
			header: Object.assign({
				fileName: path,
				typeFlag: TarHeaderLinkIndicatorType.DIRECTORY
			}, headerOptions)
		});
	}
}