import { TarUtility, AsyncUint8Array } from '../common';
import { TarHeader, TarHeaderLinkIndicatorType } from '../header';

import {
	TarEntry,
	TarEntryUtility,
	TarEntryIterator,
	TarEntryAttributes,
	AsyncTarEntryIterator,
	TarEntryDelegate
} from '../entry';

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
	public static create(entries: TarEntryAttributes[]): Uint8Array {
		const safeEntries = Array.from(entries).filter(v => !!v);
		return TarEntryUtility.generatePaddedCompositeBuffer(safeEntries);
	}

	/**
	 * Parses a set of TarEntry instances from the given async buffer.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static async extractAsync(
		buffer: AsyncUint8Array,
		onNextEntry?: TarEntryDelegate
	): Promise<TarEntry[]> {
		return AsyncTarEntryIterator.extractAll(buffer, onNextEntry);
	}

	public toUint8Array(): Uint8Array {
		const attrs = Array.from(this.entries).map(e => e.toAttributes());
		return Tarball.create(attrs);
	}

	public setBuffer(buffer: Uint8Array): this {
		this.entries = Tarball.extract(buffer);
		return this;
	}

	public add(attrs: TarEntryAttributes): this {
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