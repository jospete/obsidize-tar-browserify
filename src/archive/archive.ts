import { AsyncUint8ArrayIterator } from '../common/async-uint8-array-iterator';
import { TarEntry } from '../entry/tar-entry';
import { ArchiveReader } from './archive-reader';
import { ArchiveWriter } from './archive-writer';

/**
 * Main entry point for extracting and creating tarballs.
 * See TarIterator and TarEntry for more granular options.
 */
export class Archive extends ArchiveWriter {

	/**
	 * Parses a set of TarEntry instances from the given buffer.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static extract(buffer: Uint8Array): Promise<TarEntry[]> {
		const iterator = AsyncUint8ArrayIterator.fromMemory(buffer);
		const reader = new ArchiveReader(iterator);
		return reader.readAllEntries();
	}
}
