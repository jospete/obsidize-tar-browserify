import { PaxHeaderKey } from './pax-header-key';

export namespace PaxHeaderUtility {
	const knownKeys: string[] = [
		PaxHeaderKey.COMMENT,
		PaxHeaderKey.GROUP_ID,
		PaxHeaderKey.GROUP_NAME,
		PaxHeaderKey.HDR_CHARSET,
		PaxHeaderKey.LINK_PATH,
		PaxHeaderKey.MODIFICATION_TIME,
		PaxHeaderKey.PATH,
		PaxHeaderKey.SIZE,
		PaxHeaderKey.USER_ID,
		PaxHeaderKey.USER_NAME
	];

	export function isKnownHeaderKey(key: string): boolean {
		return knownKeys.includes(key);
	}
}