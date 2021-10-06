import { AsyncUint8Array } from '../common';

import {
	TarEntry,
	TarEntryUtility,
	TarEntryIterator,
	TarEntryAttributes,
	AsyncTarEntryIterator
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
		const iterator = new TarEntryIterator();
		iterator.initialize(buffer);
		return Array.from(iterator);
	}

	/**
	 * Generates a tar file buffer from the given attributes list.
	 */
	public static create(entries: TarEntryAttributes[]): Uint8Array {
		const safeEntries = Array.from(entries).filter(v => !!v);
		return TarEntryUtility.generatePaddedCompositeBuffer(safeEntries);
	}

	public static async extractAsync(
		buffer: AsyncUint8Array,
		onNextFile: (entry: TarEntry) => void
	): Promise<TarEntry[]> {

		if (!onNextFile) onNextFile = () => null;

		const iterator = new AsyncTarEntryIterator();
		const result: TarEntry[] = [];
		iterator.initialize(buffer);

		for await (const entry of iterator) {
			onNextFile(entry);
			result.push(entry);
		}

		return result;
	}

	public setBuffer(buffer: Uint8Array): this {
		this.entries = Tarball.extract(buffer);
		return this;
	}

	public add(attrs: TarEntryAttributes): this {
		this.entries.push(TarEntry.fromAttributes(attrs));
		return this;
	}

	public toUint8Array(): Uint8Array {
		const attrs = Array.from(this.entries).map(e => e.toAttributes());
		return Tarball.create(attrs);
	}
}