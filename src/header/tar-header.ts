import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { PaxTarHeader, PaxTarHeaderAttributes } from '../pax/pax-tar-header';
import { PaxTarHeaderKey } from '../pax/pax-tar-header-key';
import { TarHeaderField } from './tar-header-field';
import { TarHeaderLike } from './tar-header-like';
import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';
import { TarHeaderUtility } from './tar-header-utility';

/**
 * Options that can be passed to `TarHeader.from()` to customize
 * how the resulting object will be built.
 */
export interface TarHeaderBuilderOptions {
	/**
	 * When true, will cause the generated header
	 * to contain PAX metadata if needed.
	 * 
	 * For example, the header may be converted to a pax header
	 * if the file name field exceeds the default USTAR limit
	 * of 100 bytes.
	 */
	pax?: boolean;
}

const defaultOptions: TarHeaderBuilderOptions = {
	pax: true
};

/**
 * Facade over a backing Uint8Array buffer to consume/edit header data
 * at a specific location in the buffer.
 * 
 * Does not perform any mutations or reads on creation, and
 * lazy loads/sets data via getters and setters.
 */
export class TarHeader implements TarHeaderLike {
	public pax: PaxTarHeader | null = null;
	public paxPreamble: TarHeader | null = null;

	constructor(
		public readonly bytes: Uint8Array = new Uint8Array(Constants.HEADER_SIZE), 
		public readonly offset: number = 0
	) {
	}

	/**
	 * @returns A copy of the defaults used by all headers
	 */
	public static defaultValues(): TarHeaderLike {
		return {
			fileName: '',
			fileMode: Constants.FILE_MODE_DEFAULT,
			groupUserId: 0,
			ownerUserId: 0,
			fileSize: 0,
			lastModified: TarUtility.getTarTimestamp(),
			headerChecksum: 0,
			linkedFileName: '',
			typeFlag: TarHeaderLinkIndicatorType.NORMAL_FILE,
			ustarIndicator: Constants.USTAR_INDICATOR_VALUE,
			ustarVersion: Constants.USTAR_VERSION_VALUE,
			ownerUserName: '',
			ownerGroupName: '',
			deviceMajorNumber: '00',
			deviceMinorNumber: '00',
			fileNamePrefix: ''
		};
	}

	public static isTarHeader(value: any): boolean {
		return !!(value && (value instanceof TarHeader));
	}

	/**
	 * @returns A new `TarHeader` instance based on the given attributes (if they are a POJO).
	 * Note that if the given value is already a TarHeader instance, this will return it as-is.
	 */
	public static from(
		attrs: TarHeaderLike | Partial<TarHeaderLike>,
		options?: TarHeaderBuilderOptions
	): TarHeader {
		if (TarHeader.isTarHeader(attrs)) {
			return attrs as TarHeader;
		}

		return new TarHeader().initialize(attrs, options);
	}

	/**
	 * Short-hand for constructing a new `TarHeader` and immediately calling `toUint8Array()` on it
	 */
	public static serialize(attrs: TarHeaderLike | Partial<TarHeaderLike>): Uint8Array {
		if (TarHeader.isTarHeader(attrs)) {
			return (attrs as TarHeader).toUint8Array();
		}

		return TarHeader.from(attrs).toUint8Array();
	}

	/**
	 * @returns A new `TarHeader` instance populated with the content returned by `defaultValues()`
	 */
	public static seeded(): TarHeader {
		return TarHeader.from({});
	}
	
	private static collectPaxRequiredAttributes(
		attrs: TarHeaderLike | Partial<TarHeaderLike>
	): Partial<PaxTarHeaderAttributes> | null {
		let collected: Partial<PaxTarHeaderAttributes> = {};

		if (attrs.fileName && attrs.fileName.length > TarHeaderField.fileName.size) {
			collected.path = attrs.fileName;
		}

		if (Object.keys(collected).length > 0) {
			return collected;
		}

		return null;
	}

	private static splitBaseFileName(fileName: string): string[] {
		let offset = fileName.lastIndexOf('/');
		
		if (offset >= 0) {
			return [fileName.substring(0, offset), fileName.substring(offset + 1)];
		}

		offset = fileName.lastIndexOf('\\');
		
		if (offset >= 0) {
			return [fileName.substring(0, offset), fileName.substring(offset + 1)];
		}

		return ['', fileName];
	}

	public get byteLength(): number {
		let result = Constants.HEADER_SIZE;
		
		if (this.pax && this.paxPreamble) {
			result += (this.pax.calculateSectorByteLength() + this.paxPreamble!.byteLength);
		}

		return result;
	}

	public get fileName(): string {
		return this.pax?.has(PaxTarHeaderKey.PATH) ? this.pax.path! : this.ustarFileName;
	}

	public get ustarFileName(): string {
		return TarHeaderField.fileName.readFrom(this.bytes, this.offset)!;
	}

	public set ustarFileName(value: string) {
		TarHeaderField.fileName.writeTo(this.bytes, this.offset, value);
	}

	public get fileMode(): number {
		return TarHeaderField.fileMode.readFrom(this.bytes, this.offset)!;
	}

	public set fileMode(value: number) {
		TarHeaderField.fileMode.writeTo(this.bytes, this.offset, value);
	}

	public get ownerUserId(): number {
		return this.pax?.has(PaxTarHeaderKey.USER_ID) ? this.pax.userId! : this.ustarOwnerUserId;
	}

	public get ustarOwnerUserId(): number {
		return TarHeaderField.ownerUserId.readFrom(this.bytes, this.offset)!;
	}

	public set ustarOwnerUserId(value: number) {
		TarHeaderField.ownerUserId.writeTo(this.bytes, this.offset, value);
	}

	public get groupUserId(): number {
		return this.pax?.has(PaxTarHeaderKey.GROUP_ID) ? this.pax.groupId : this.ustarGroupUserId;
	}

	public get ustarGroupUserId(): number {
		return TarHeaderField.groupUserId.readFrom(this.bytes, this.offset)!;
	}

	public set ustarGroupUserId(value: number) {
		TarHeaderField.groupUserId.writeTo(this.bytes, this.offset, value);
	}

	public get fileSize(): number {
		return this.pax?.has(PaxTarHeaderKey.SIZE) ? this.pax.size! : this.ustarFileSize;
	}

	public get ustarFileSize(): number {
		return TarHeaderField.fileSize.readFrom(this.bytes, this.offset)!;
	}

	public set ustarFileSize(value: number) {
		TarHeaderField.fileSize.writeTo(this.bytes, this.offset, value);
	}

	public get lastModified(): number {
		return this.pax?.has(PaxTarHeaderKey.MODIFICATION_TIME)
			? TarUtility.paxTimeToDate(this.pax.modificationTime!)
			: this.ustarLastModified;
	}

	public get ustarLastModified(): number {
		return TarHeaderField.lastModified.readFrom(this.bytes, this.offset)!;
	}

	public set ustarLastModified(value: number) {
		TarHeaderField.lastModified.writeTo(this.bytes, this.offset, TarUtility.dateTimeToUstar(value));
	}

	public get headerChecksum(): number {
		return TarHeaderField.headerChecksum.readFrom(this.bytes, this.offset)!;
	}

	public set headerChecksum(value: number) {
		TarHeaderField.headerChecksum.writeTo(this.bytes, this.offset, value);
	}

	public get linkedFileName(): string {
		return this.pax?.has(PaxTarHeaderKey.LINK_PATH) ? this.pax.linkPath! : this.ustarLinkedFileName;
	}

	public get ustarLinkedFileName(): string {
		return TarHeaderField.linkedFileName.readFrom(this.bytes, this.offset)!;
	}

	public set ustarLinkedFileName(value: string) {
		TarHeaderField.linkedFileName.writeTo(this.bytes, this.offset, value);
	}

	public get typeFlag(): TarHeaderLinkIndicatorType {
		return (TarHeaderField.typeFlag.readFrom(this.bytes, this.offset) as TarHeaderLinkIndicatorType)
			|| TarHeaderLinkIndicatorType.UNKNOWN;
	}

	public set typeFlag(value: TarHeaderLinkIndicatorType) {
		TarHeaderField.typeFlag.writeTo(this.bytes, this.offset, value);
	}

	public get ustarIndicator(): string {
		return TarHeaderField.ustarIndicator.readFrom(this.bytes, this.offset)!;
	}

	public get ustarVersion(): string {
		return TarHeaderField.ustarVersion.readFrom(this.bytes, this.offset)!;
	}

	public set ustarVersion(value: string) {
		TarHeaderField.ustarVersion.writeTo(this.bytes, this.offset, value);
	}

	public get ownerUserName(): string {
		return this.pax?.has(PaxTarHeaderKey.USER_NAME) ? this.pax.userName! : this.ustarOwnerUserName;
	}

	public get ustarOwnerUserName(): string {
		return TarHeaderField.ownerUserName.readFrom(this.bytes, this.offset)!;
	}

	public set ustarOwnerUserName(value: string) {
		TarHeaderField.ownerUserName.writeTo(this.bytes, this.offset, value);
	}

	public get ownerGroupName(): string {
		return this.pax?.has(PaxTarHeaderKey.GROUP_NAME) ? this.pax.groupName! : this.ustarOwnerGroupName;
	}

	public get ustarOwnerGroupName(): string {
		return TarHeaderField.ownerGroupName.readFrom(this.bytes, this.offset)!;
	}

	public set ustarOwnerGroupName(value: string) {
		TarHeaderField.ownerGroupName.writeTo(this.bytes, this.offset, value);
	}

	public get deviceMajorNumber(): string {
		return TarHeaderField.deviceMajorNumber.readFrom(this.bytes, this.offset)!;
	}

	public set deviceMajorNumber(value: string) {
		TarHeaderField.deviceMajorNumber.writeTo(this.bytes, this.offset, value);
	}

	public get deviceMinorNumber(): string {
		return TarHeaderField.deviceMinorNumber.readFrom(this.bytes, this.offset)!;
	}

	public set deviceMinorNumber(value: string) {
		TarHeaderField.deviceMinorNumber.writeTo(this.bytes, this.offset, value);
	}

	public get fileNamePrefix(): string {
		return TarHeaderField.fileNamePrefix.readFrom(this.bytes, this.offset)!;
	}

	public set fileNamePrefix(value: string) {
		TarHeaderField.fileNamePrefix.writeTo(this.bytes, this.offset, value);
	}

	public get isPaxHeader(): boolean {
		return this.isLocalPaxHeader || this.isGlobalPaxHeader;
	}

	public get isGlobalPaxHeader(): boolean {
		return this.isGlobalPaxPreHeader || this.isGlobalPaxPostHeader;
	}

	public get isLocalPaxHeader(): boolean {
		return this.isLocalPaxPreHeader || this.isLocalPaxPostHeader;
	}

	public get isGlobalPaxPreHeader(): boolean {
		return this.typeFlag === TarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER;
	}

	public get isLocalPaxPreHeader(): boolean {
		return this.typeFlag === TarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER;
	}

	public get isGlobalPaxPostHeader(): boolean {
		return this.paxPreamble?.isGlobalPaxHeader ?? false;
	}

	public get isLocalPaxPostHeader(): boolean {
		return this.paxPreamble?.isLocalPaxHeader ?? false;
	}

	public get isFileHeader(): boolean {
		return TarHeaderUtility.isTarHeaderLinkIndicatorTypeFile(this.typeFlag);
	}

	public get isDirectoryHeader(): boolean {
		return TarHeaderUtility.isTarHeaderLinkIndicatorTypeDirectory(this.typeFlag);
	}

	/**
	 * Removes any unknown or un-standardized keys from
	 * the PAX portion of this header (if one exists).
	 * 
	 * See also `PaxTarHeader.clean()`.
	 * 
	 * @returns `this` for operation chaining
	 */
	public clean(): this {
		this.pax?.clean();
		return this;
	}

	/**
	 * @returns A snapshot of the underlying buffer for this header
	 */
	public toUint8Array(): Uint8Array {
		if (this.isPaxHeader && this.pax && this.paxPreamble) {
			const preambleBytes = this.paxPreamble.bytes;
			const paxBytes = this.pax.toUint8Array();
			const ownBytes = this.bytes;
			const paxSectorSize = TarUtility.roundUpSectorOffset(paxBytes.byteLength);
			const totalSize = preambleBytes.byteLength + paxSectorSize + ownBytes.byteLength;
			const result = new Uint8Array(totalSize);
			let offset = 0;

			result.set(this.paxPreamble.bytes, offset);
			offset += preambleBytes.byteLength;

			result.set(paxBytes, offset);
			offset += paxSectorSize;

			result.set(ownBytes, offset);

			return result;
		}

		return this.bytes.slice(this.offset, this.offset + Constants.HEADER_SIZE);
	}

	public toJSON(): Record<string, unknown> {
		const attributes = this.toAttributes();
		const {pax, paxPreamble: preamble, bytes, offset} = this;

		const buffer = {
			byteLength: bytes.byteLength,
			content: TarUtility.getDebugHexString(bytes)
		};

		return {
			offset,
			attributes,
			buffer,
			preamble,
			pax
		};
	}

	public toAttributes(): TarHeaderLike {
		const {
			fileName,
			fileMode,
			groupUserId,
			ownerUserId,
			fileSize,
			lastModified,
			headerChecksum,
			linkedFileName,
			typeFlag,
			ustarIndicator,
			ustarVersion,
			ownerUserName,
			ownerGroupName,
			deviceMajorNumber,
			deviceMinorNumber,
			fileNamePrefix
		} = this;
		return {
			fileName,
			fileMode,
			groupUserId,
			ownerUserId,
			fileSize,
			lastModified,
			headerChecksum,
			linkedFileName,
			typeFlag,
			ustarIndicator,
			ustarVersion,
			ownerUserName,
			ownerGroupName,
			deviceMajorNumber,
			deviceMinorNumber,
			fileNamePrefix
		};
	}

	private asLocalPaxPreamble(): TarHeader {
		const attrs = Object.assign(this.toAttributes(), {
			fileName: PaxTarHeader.wrapFileName(this.fileName),
			typeFlag: TarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER
		});

		return TarHeader.from(attrs, {pax: false});
	}

	/**
	 * Override all values in the header.
	 * Any values not provided in `attrs` will be filled in with default values.
	 * @returns `this` for operation chaining
	 */
	public initialize(
		attrs: TarHeaderLike | Partial<TarHeaderLike> = {},
		options: TarHeaderBuilderOptions | null = {}
	): this {
		const completeAttrs: TarHeaderLike = Object.assign(TarHeader.defaultValues(), (attrs || {}));
		const combinedOptions = Object.assign({}, defaultOptions, (options || {}));
		const paxRequiredAttributes = TarHeader.collectPaxRequiredAttributes(completeAttrs);

		this.update(completeAttrs);

		if (combinedOptions.pax && paxRequiredAttributes) {
			if (paxRequiredAttributes.path) {
				const [directoryName, fileName] = TarHeader.splitBaseFileName(paxRequiredAttributes.path);
				this.ustarFileName = fileName;
				this.fileNamePrefix = directoryName;
			}

			this.pax = new PaxTarHeader(paxRequiredAttributes);
			this.ustarLastModified = this.lastModified; // sync modification time between the two headers
			this.paxPreamble = this.asLocalPaxPreamble();

		} else {
			this.paxPreamble = null;
			this.pax = null;
		}
		
		return this;
	}

	/**
	 * Ensures the state of the header is synced after changes have been made.
	 * @returns `this` for operation chaining
	 */
	public normalize(): this {
		this.ustarLastModified = TarUtility.sanitizeTimestamp(this.ustarLastModified!);
		let checksum = TarHeaderUtility.CHECKSUM_SEED;

		for (const field of TarHeaderUtility.CHECKSUM_FIELDS) {
			checksum += field.calculateChecksum(this.bytes, this.offset);
		}

		this.headerChecksum = checksum;
		return this;
	}

	/**
	 * Mechanism to batch-update properties.
	 * Automatically normalizes the header if any changes were made.
	 * @returns `this` for operation chaining
	 */
	public update(attrs: TarHeaderLike | Partial<TarHeaderLike>): this {
		if (!attrs) {
			return this;
		}
		
		let didModifyAnyField = false;

		for (const field of TarHeaderUtility.ALL_FIELDS) {
			const value = (attrs as any)[field.name];

			if (TarUtility.isDefined(value)) {
				const modified = field.writeTo(this.bytes, this.offset, value);
				didModifyAnyField = didModifyAnyField || modified;
			}
		}

		if (didModifyAnyField) {
			this.normalize();
		}

		return this;
	}
}
