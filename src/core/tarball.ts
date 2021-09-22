import { TarEntry, TarEntryUtility } from '../entry';
import { TarEntryIterator } from './tar-entry-iterator';
import { TarUtility } from '../tar-utility';

/**
 * Main entry point for reading tarballs.
 * 
 * 
 * High-level wrapper for a blob of uint8 data.
 * See TarIterator for more granular options.
 */
export class Tarball {

	private readonly iterator: TarEntryIterator = new TarEntryIterator();

	constructor(
		public readonly buffer: Uint8Array
	) {
	}

	public static from(entries: TarEntry[]): Uint8Array {
		const entryAttrs = TarUtility.toArray(entries).map(e => e.toAttributes());
		return TarEntryUtility.generateCompositeBuffer(entryAttrs);
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