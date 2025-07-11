import { AsyncUint8ArrayIteratorInput } from '../common/async-uint8-array-iterator';
import { ArchiveEntry } from './archive-entry';
import { ArchiveReader } from './archive-reader';
import { ArchiveWriter } from './archive-writer';

/**
 * Main entry point for extracting and creating tarballs.
 * See TarIterator and ArchiveEntry for more granular options.
 */
export class Archive extends ArchiveWriter {
	constructor(entries?: ArchiveEntry[]) {
		super(entries);
	}

	/**
	 * Parses an Archive instance from the given buffer, with all entries read into memory.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static async extract(input: AsyncUint8ArrayIteratorInput): Promise<Archive> {
		const reader = ArchiveReader.withInput(input);
		const entries = await reader.readAllEntries();
		return new Archive(entries);
	}

	/**
	 * Iterate over entries in-place from a given source buffer.
	 * The buffer should come from a complete, uncompressed tar file.
	 */
	public static read(input: AsyncUint8ArrayIteratorInput): AsyncIterable<ArchiveEntry> {
		return ArchiveReader.withInput(input);
	}
}
