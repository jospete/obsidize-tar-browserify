export const SECTOR_SIZE = 512;
export const OCTAL_RADIX = 8;
export const USTAR_TAG = 'ustar';
export const USTAR_INDICATOR_VALUE = `${USTAR_TAG}\0`;
export const USTAR_VERSION_VALUE = '00';
export const HEADER_SIZE = SECTOR_SIZE;
export const FILE_MODE_DEFAULT = 511; // '777' octal