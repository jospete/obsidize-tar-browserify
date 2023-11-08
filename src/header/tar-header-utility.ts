import { Constants } from '../common/constants';
import { TarHeaderField } from './tar-header-field';

export namespace TarHeaderUtility {

	export function isUstarSector(input: Uint8Array, offset?: number): boolean {
		return TarHeaderField.ustarIndicator.sliceString(input, offset).startsWith(Constants.USTAR_TAG);
	}
}