import { TarFile } from './tar-file';
import { TarIterator } from './tar-iterator';

/**
 * High-level wrapper for a blob of uint8 data.
 * See TarIterator for more granular options.
 */
export class Tarball {

	private readonly iterator = new TarIterator();

	constructor(
		public readonly buffer: Uint8Array
	) {
	}

	public readAllFiles(): TarFile[] {
		this.iterator.initialize(this.buffer);
		return Array.from(this.iterator);
	}
}