import { TarHeaderField } from './tar-header-field';
import { TarHeader } from './tar-header';

export interface TarHeaderFieldExtractionResult<T> {
	field: TarHeaderField;
	bytes: Uint8Array;
	value: T;
}

export type TarHeaderExtractionResult = {
	[key in keyof TarHeader]: TarHeaderFieldExtractionResult<any>;
};