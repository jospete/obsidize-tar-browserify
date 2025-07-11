import { AsyncUint8ArrayLike } from '../common/async-uint8-array';
import { TarEntry } from '../entry/tar-entry';
import { ArchiveReader } from './archive-reader';
import { ArchiveWriter } from './archive-writer';

/**
 * Main entry point for extracting and creating tarballs.
 * See TarIterator and TarEntry for more granular options.
 */
export class Archive extends ArchiveWriter {
	constructor(entries?: TarEntry[]) {
		super(entries);
	}

	/**
	 * Parses an Archive instance from the given buffer, with all entries read into memory.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static async extract(buffer: Uint8Array | AsyncUint8ArrayLike): Promise<Archive> {
		const reader = ArchiveReader.withInput(buffer);
		const entries = await reader.readAllEntries();
		return new Archive(entries);
	}

	/**
	 * Iterate over entries in-place from a given source buffer.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static read(buffer: Uint8Array | AsyncUint8ArrayLike): AsyncIterable<TarEntry> {
		return ArchiveReader.withInput(buffer);
	}
}
