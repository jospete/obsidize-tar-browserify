import { TarHeader } from '../header/tar-header.ts';
import { AsyncUint8ArrayLike } from './async-uint8-array.ts';

export interface ArchiveEntryLike {
	readonly sourceContext?: ArchiveContext | null;
	readonly header: TarHeader;
	readonly sourceOffset: number;
	readonly sourceHeaderByteLength: number;
	readNextContentChunk(): Promise<Uint8Array | null>;
}

export interface ArchiveContext {
	readonly source: AsyncUint8ArrayLike;
	readonly globalPaxHeaders: TarHeader[];
	tryLoadNextEntryContentChunk(entry: ArchiveEntryLike): Promise<Uint8Array | null>;
}
