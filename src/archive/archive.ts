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
	 * Parses a set of TarEntry instances from the given buffer.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static async extract(buffer: Uint8Array): Promise<Archive> {
		return new Archive(await ArchiveReader.readAllEntriesFromMemory(buffer));
	}

	/**
	 * One level down from `extract()` that takes an `AsyncUint8ArrayLike` ref directly.
	 * This replaces the 4.x `extractAsync` option.
	 */
	public static async extractFromStream(stream: AsyncUint8ArrayLike): Promise<Archive> {
		return new Archive(await ArchiveReader.readAllEntriesFromStream(stream));
	}
}
