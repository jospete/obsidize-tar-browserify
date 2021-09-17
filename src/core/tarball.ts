import { TarEntryIterator } from './tar-entry-iterator';
import { TarUtility } from './tar-utility';
import { TarEntry } from './tar-entry';

const { isUint8Array, concatUint8Arrays, toArray } = TarUtility;

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
		const buffers = toArray(entries)
			.filter(v => TarEntry.isTarEntry(v))
			.map(v => v.toUint8Array());
		return concatUint8Arrays(buffers);
	}

	public readAllEntries(): TarEntry[] {
		this.iterator.initialize(this.buffer);
		return Array.from(this.iterator);
	}

	public toJSON(): any {
		const byteCount = isUint8Array(this.buffer) ? this.buffer.byteLength : 0;
		return `Tarball <${byteCount} bytes>`;
	}
}