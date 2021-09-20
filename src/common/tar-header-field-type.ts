/**
 * Determines how a tar header field is interpreted to and from a Uint8Array.
 */
export enum TarHeaderFieldType {

	/**
	 * Bytes interpreted as char codes.
	 */
	ASCII = 'ASCII',

	/**
	 * Bytes interpreted as char codes with spaces and trailing NUL characters.
	 */
	ASCII_PADDED = 'ASCII_PADDED',

	/**
	 * Bytes interpreted as a number from octal number characters (i.e. '0' - '7')
	 */
	INTEGER_OCTAL = 'INTEGER_OCTAL'
}