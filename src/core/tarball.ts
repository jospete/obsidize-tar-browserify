import { TarUtility } from '../common';
import { TarEntry, TarEntryUtility, TarEntryIterator, TarEntryAttributes } from '../entry';

/**
 * Main entry point for extracting and creating tarballs.
 * See TarIterator and TarEntry for more granular options.
 */
export class Tarball {

	private readonly iterator: TarEntryIterator = new TarEntryIterator();

	constructor(
		public readonly buffer: Uint8Array
	) {
	}

	/**
	 * Parses a set of TarEntry instances from the given buffer.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static extract(buffer: Uint8Array): TarEntry[] {
		return new Tarball(buffer).readAllEntries();
	}

	/**
	 * Generates a tar file buffer from the given attributes list.
	 */
	public static create(entries: TarEntryAttributes[]): Uint8Array {
		const safeEntries = Array.from(entries).filter(v => !!v);
		return TarEntryUtility.generatePaddedCompositeBuffer(safeEntries);
	}

	public readAllEntries(): TarEntry[] {
		this.iterator.initialize(this.buffer);
		return Array.from(this.iterator);
	}

	public toJSON(): any {
		const byteCount = TarUtility.isUint8Array(this.buffer) ? this.buffer.byteLength : 0;
		return `Tarball <${byteCount} bytes>`;
	}
}