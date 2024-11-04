/**
 * Special keys used in the PAX format standard.
 * https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_03
 */
export enum PaxTarHeaderKey {
	/**
	 * A series of characters used as a comment. All characters in the <value> field shall be ignored by pax.
	 */
	COMMENT = 'comment',
	/**
	 * The group ID of the group that owns the file, expressed as a decimal number using
	 * digits from the ISO/IEC 646:1991 standard. This record shall override the gid 
	 * field in the following header block(s). When used in write or copy mode,
	 * pax shall include a gid extended header record for each file whose group ID is greater 
	 * than 2097151 (octal 7777777).
	 */
	GROUP_ID = 'gid',
	/**
	 * The group of the file(s), formatted as a group name in the group database.
	 * This record shall override the gid and gname fields in the following header block(s), 
	 * and any gid extended header record. When used in read, copy, or list mode,
	 * pax shall translate the name from the encoding in the header record to the character 
	 * set appropriate for the group database on the receiving system.
	 * If any of the characters cannot be translated, and if neither the -o invalid=UTF-8 option nor 
	 * the -o invalid=binary option is specified, the results are implementation-defined.
	 * When used in write or copy mode, pax shall include a gname extended header 
	 * record for each file whose group name cannot be represented entirely
	 * with the letters and digits of the portable character set.
	 */
	GROUP_NAME = 'gname',
	/**
	 * The name of the character set used to encode the value field of the
	 * gname, linkpath, path, and uname pax extended header records. The entries in the following 
	 * table are defined to refer to known standards;
	 * additional names may be agreed between the originator and the recipient.
	 */
	HDR_CHARSET = 'hdrcharset',
	/**
	 * The pathname of a link being created to another file, of any type, previously archived.
	 * This record shall override the linkname field in the following ustar header block(s).
	 * The following ustar header block shall determine the type of link created.
	 * If typeflag of the following header block is 1, it shall be a hard link.
	 * If typeflag is 2, it shall be a symbolic link and the linkpath value shall be
	 * the contents of the symbolic link. The pax utility shall translate the name of
	 * the link (contents of the symbolic link) from the encoding in the header to the
	 * character set appropriate for the local file system. When used in write or copy mode,
	 * pax shall include a linkpath extended header record for each link whose pathname cannot
	 * be represented entirely with the members of the portable character set other than NUL.
	 */
	LINK_PATH = 'linkpath',
	/**
	 * The file modification time of the following file(s),
	 * equivalent to the value of the st_mtime member of the stat structure for a file,
	 * as described in the stat() function. This record shall override the mtime field in the following header block(s).
	 * The modification time shall be restored if the process has appropriate privileges required to do so.
	 * The format of the <value> shall be as described in pax Extended Header File Times.
	 */
	MODIFICATION_TIME = 'mtime',
	/**
	 * The pathname of the following file(s). This record shall override the name and prefix fields in the following header block(s).
	 * The pax utility shall translate the pathname of the file from
	 * the encoding in the header to the character set appropriate for the local file system.
	 * 
	 * When used in write or copy mode, pax shall include a path extended header record for each file whose
	 * pathname cannot be represented entirely with the members of the portable character set other than NUL.
	 */
	PATH = 'path',
	/**
	 * The size of the file in octets, expressed as a decimal number using digits from the ISO/IEC 646:1991 standard.
	 * This record shall override the size field in the following header block(s). When used in write or copy mode,
	 * pax shall include a size extended header record for each file with a size value greater than 8589934591 (octal 77777777777).
	 */
	SIZE = 'size',
	/**
	 * The user ID of the file owner, expressed as a decimal number using digits from the ISO/IEC 646:1991 standard.
	 * This record shall override the uid field in the following header block(s). When used in write or copy mode,
	 * pax shall include a uid extended header record for each file whose owner ID is greater than 2097151 (octal 7777777).
	 */
	USER_ID = 'uid',
	/**
	 * The owner of the following file(s), formatted as a user name in the user database.
	 * This record shall override the uid and uname fields in the following header block(s),
	 * and any uid extended header record. When used in read, copy, or list mode,
	 * pax shall translate the name from the encoding in the header record to the character set appropriate for
	 * the user database on the receiving system. If any of the characters cannot be translated,
	 * and if neither the -o invalid=UTF-8 option nor the -o invalid=binary option is specified,
	 * the results are implementation-defined. When used in write or copy mode,
	 * pax shall include a uname extended header record for each file whose user name cannot
	 * be represented entirely with the letters and digits of the portable character set.
	 */
	USER_NAME = 'uname'
}
