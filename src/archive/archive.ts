import { AsyncUint8ArrayLike, InMemoryAsyncUint8Array } from '../common/async-uint8-array';
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
		return Archive.extractFromStream(new InMemoryAsyncUint8Array(buffer));
	}

	/**
	 * One level down from `extract()` that takes an `AsyncUint8ArrayLike` ref directly.
	 * This replaces the 4.x `extractAsync` option.
	 */
	public static extractFromStream(stream: AsyncUint8ArrayLike): Promise<TarEntry[]> {
		const iterator = new AsyncUint8ArrayIterator(stream);
		const reader = new ArchiveReader(iterator);
		return reader.readAllEntries();
	}
}
