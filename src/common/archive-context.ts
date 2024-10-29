import { PaxTarHeader } from '../pax/pax-tar-header';
import { AsyncUint8ArrayLike } from './async-uint8-array';

export interface ArchiveContext {
	readonly source: AsyncUint8ArrayLike;
	readonly globalPaxHeaders: PaxTarHeader[];
}
