/**
 * Sector type flag values taken from here:
 * (see "Type flag field" in wiki)
 *
 * https://en.wikipedia.org/wiki/Tar_(computing)
 *
 * Special notes from the wiki:
 * 'A'–'Z' - Vendor specific extensions (POSIX.1-1988)
 * All other values	- Reserved for future standardization
 */
export enum UstarHeaderLinkIndicatorType {
	/**
	 * Special local indicator for this module to indicate a parse failure
	 */
	UNKNOWN = 'UNKNOWN',

	NORMAL_FILE = '0',
	NORMAL_FILE_ALT1 = '\0',
	NORMAL_FILE_ALT2 = '',
	HARD_LINK = '1',
	SYMBOLIC_LINK = '2',
	CHARACTER_SPECIAL = '3',
	BLOCK_SPECIAL = '4',
	DIRECTORY = '5',
	FIFO = '6',
	CONTIGUOUS_FILE = '7',

	/**
	 * Global extended header with meta data (POSIX.1-2001)
	 */
	GLOBAL_EXTENDED_HEADER = 'g',

	/**
	 * Extended header with meta data for the next file in the archive (POSIX.1-2001)
	 */
	LOCAL_EXTENDED_HEADER = 'x',

	/**
	 * GNU special snowflake tar header types
	 */
	GNU_LONG_LINK_PATH_HEADER = 'K',
	GNU_LONG_PATH_HEADER = 'L',
	GNU_LONG_PATH_HEADER_ALT1 = 'N',
}
