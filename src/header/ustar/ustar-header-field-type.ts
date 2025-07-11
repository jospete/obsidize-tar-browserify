/**
 * Determines how a tar header field is interpreted to and from a Uint8Array.
 */
export enum UstarHeaderFieldType {
	/**
	 * Bytes interpreted as char codes.
	 */
	ASCII = 'ASCII',
	/**
	 * Bytes interpreted as char codes with spaces and trailing NUL characters.
	 *
	 * @example
	 * 'Test File Name.txt\0\0\0\0\0\0\0....'
	 */
	ASCII_PADDED_END = 'ASCII_PADDED_END',
	/**
	 * Bytes interpreted as a padded ascii octal number (i.e. ascii in range ['0' - '7']).
	 * USTAR format dictates that all octal integer values of this type should be front-padded with zeroes.
	 *
	 * @example
	 * '0000232 ' // (equates to decimal 1234)
	 */
	INTEGER_OCTAL = 'INTEGER_OCTAL',
	/**
	 * Special flavor of an integer octal that also transforms the
	 * value by 1000x to add the milliseconds frame for a Date value.
	 */
	INTEGER_OCTAL_TIMESTAMP = 'INTEGER_OCTAL_TIMESTAMP',
}
