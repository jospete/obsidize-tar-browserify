import { PaxTarHeaderKey } from './pax-tar-header-key';

export namespace PaxTarHeaderUtility {
	const knownKeys: string[] = [
		PaxTarHeaderKey.COMMENT,
		PaxTarHeaderKey.GROUP_ID,
		PaxTarHeaderKey.GROUP_NAME,
		PaxTarHeaderKey.HDR_CHARSET,
		PaxTarHeaderKey.LINK_PATH,
		PaxTarHeaderKey.MODIFICATION_TIME,
		PaxTarHeaderKey.PATH,
		PaxTarHeaderKey.SIZE,
		PaxTarHeaderKey.USER_ID,
		PaxTarHeaderKey.USER_NAME
	];

	export function isKnownHeaderKey(key: string): boolean {
		return knownKeys.includes(key);
	}
}