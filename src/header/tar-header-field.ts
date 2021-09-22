import { TarHeader } from './tar-header';
import { TarHeaderFieldType } from './tar-header-field-type';

/**
 * Metadata about a single field for a tar header.
 * These are used to dynamically parse fields as a header sector is stepped through.
 * 
 * See extractTarEntry() and TarUtility for more info.
 */
export interface TarHeaderField {
	readonly name: keyof TarHeader;
	readonly offset: number;
	readonly size: number;
	readonly type: TarHeaderFieldType;
	constantValue?: any;
}