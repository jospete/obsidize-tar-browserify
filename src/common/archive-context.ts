import { TarHeader } from '../header/tar-header.ts';
import { AsyncUint8ArrayLike } from './async-uint8-array.ts';

export interface ArchiveContext {
	readonly source: AsyncUint8ArrayLike;
	readonly globalPaxHeaders: TarHeader[];
}
