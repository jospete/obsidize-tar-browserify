import {
	advanceSectorOffset,
	AsyncUint8Array,
	AsyncUint8ArraySearchResult,
	FILE_MODE_DEFAULT,
	findInAsyncUint8Array,
	isNumber,
	isUint8Array,
	sanitizeTimestamp,
	USTAR_INDICATOR_VALUE,
	USTAR_VERSION_VALUE
} from '../common';

import { isUstarSector } from './tar-header-field';
import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';

/**
 * Core content parsed from a tar header sector.
 */
export interface TarHeader {
	fileName: string;
	fileMode: number;
	ownerUserId: number;
	groupUserId: number;
	fileSize: number;
	lastModified: number;
	headerChecksum: number;
	linkedFileName: string;
	typeFlag: TarHeaderLinkIndicatorType;
	ustarIndicator: string;
	ustarVersion: string;
	ownerUserName: string;
	ownerGroupName: string;
	deviceMajorNumber: string;
	deviceMinorNumber: string;
	fileNamePrefix: string;
}

export function sanitizeHeader(header: Partial<TarHeader> | null): TarHeader {

	if (header && isNumber(header.lastModified)) {
		header.lastModified = sanitizeTimestamp(header.lastModified!);
	}

	return Object.assign(getDefaultHeaderValues(), (header || {})) as TarHeader;
}

export function getDefaultHeaderValues(): TarHeader {
	return {
		fileName: '',
		fileMode: FILE_MODE_DEFAULT,
		groupUserId: 0,
		ownerUserId: 0,
		fileSize: 0,
		lastModified: sanitizeTimestamp(Date.now()),
		headerChecksum: 0,
		linkedFileName: '',
		typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE,
		ustarIndicator: USTAR_INDICATOR_VALUE,
		ustarVersion: USTAR_VERSION_VALUE,
		ownerUserName: '',
		ownerGroupName: '',
		deviceMajorNumber: '00',
		deviceMinorNumber: '00',
		fileNamePrefix: ''
	};
}

/**
 * Searches through the given AsyncUint8Array for the next USTAR sector,
 * starting at the given offset.
 */
export function findNextUstarSectorAsync(
	input: AsyncUint8Array,
	offset: number = 0
): Promise<AsyncUint8ArraySearchResult | null> {
	return findInAsyncUint8Array(
		input,
		offset,
		1,
		value => isUstarSector(value)
	);
}

/**
 * Searches the given input buffer for a USTAR header tar sector, starting at the given offset.
 * Returns -1 if no valid header sector is found.
 */
export function findNextUstarSectorOffset(input: Uint8Array, offset: number = 0): number {

	const NOT_FOUND = -1;

	if (!isUint8Array(input)) {
		return NOT_FOUND;
	}

	const maxOffset = input.byteLength;
	let nextOffset = Math.max(0, offset);

	while (nextOffset < maxOffset && !isUstarSector(input, nextOffset)) {
		nextOffset = advanceSectorOffset(nextOffset, maxOffset);
	}

	if (nextOffset < maxOffset) {
		return nextOffset;
	}

	return NOT_FOUND;
}