export namespace Constants {
	export const SECTOR_SIZE = 512;
	export const OCTAL_RADIX = 8;
	export const USTAR_TAG = 'ustar'; // HEX = 75 73 74 61 72
	export const USTAR_INDICATOR_VALUE = `${USTAR_TAG}\0`;
	export const USTAR_VERSION_VALUE = '00';
	export const HEADER_SIZE = SECTOR_SIZE;
	export const FILE_MODE_DEFAULT = 511; // '777' octal
	export const TERMINAL_PADDING_SIZE = SECTOR_SIZE * 2;
	export const PAX_HEADER_PREFIX = 'PaxHeader';
	export const LONG_LINK_FILE_NAME = '././@LongLink';
}
