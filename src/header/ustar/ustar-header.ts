import { Constants } from '../../common/constants';
import { TarSerializable, TarUtility } from '../../common/tar-utility';
import { TarHeaderUtility } from '../tar-header-utility';
import { UstarHeaderField } from './ustar-header-field';
import { UstarHeaderLike } from './ustar-header-like';
import { UstarHeaderLinkIndicatorType } from './ustar-header-link-indicator-type';

/**
 * Facade over a backing Uint8Array buffer to consume/edit header data
 * at a specific location in the buffer.
 * 
 * Does not perform any mutations or reads on creation, and
 * lazy loads/sets data via getters and setters.
 */
export class UstarHeader implements UstarHeaderLike, TarSerializable {
	constructor(
		public readonly bytes: Uint8Array = new Uint8Array(Constants.HEADER_SIZE), 
		public readonly offset: number = 0
	) {
	}

	/**
	 * @returns A copy of the defaults used by all headers
	 */
	public static defaultValues(): UstarHeaderLike {
		return {
			fileName: '',
			fileMode: Constants.FILE_MODE_DEFAULT,
			groupUserId: 0,
			ownerUserId: 0,
			fileSize: 0,
			lastModified: TarUtility.getUstarTimestamp(),
			headerChecksum: 0,
			linkedFileName: '',
			typeFlag: UstarHeaderLinkIndicatorType.NORMAL_FILE,
			ustarIndicator: Constants.USTAR_INDICATOR_VALUE,
			ustarVersion: Constants.USTAR_VERSION_VALUE,
			ownerUserName: '',
			ownerGroupName: '',
			deviceMajorNumber: '00',
			deviceMinorNumber: '00',
			fileNamePrefix: ''
		};
	}

	public static isUstarHeader(value: any): boolean {
		return !!(value && (value instanceof UstarHeader));
	}

	/**
	 * @returns A new `UstarHeader` instance based on the given attributes (if they are a POJO).
	 * Note that if the given value is already a UstarHeader instance, this will return it as-is.
	 */
	public static from(attrs: UstarHeaderLike | Partial<UstarHeaderLike>): UstarHeader {
		if (UstarHeader.isUstarHeader(attrs)) {
			return attrs as UstarHeader;
		}

		return new UstarHeader().initialize(attrs);
	}

	/**
	 * Short-hand for constructing a new `UstarHeader` and immediately calling `toUint8Array()` on it
	 */
	public static serialize(attrs: UstarHeaderLike | Partial<UstarHeaderLike>): Uint8Array {
		if (UstarHeader.isUstarHeader(attrs)) {
			return (attrs as UstarHeader).toUint8Array();
		}

		return UstarHeader.from(attrs).toUint8Array();
	}

	/**
	 * @returns A new `UstarHeader` instance populated with the content returned by `defaultValues()`
	 */
	public static seeded(): UstarHeader {
		return UstarHeader.from({});
	}

	public get byteLength(): number {
		return this.bytes.byteLength;
	}

	public get fileName(): string {
		return UstarHeaderField.fileName.readFrom(this.bytes, this.offset)!;
	}

	public set fileName(value: string) {
		UstarHeaderField.fileName.writeTo(this.bytes, this.offset, value);
	}

	public get fileMode(): number {
		return UstarHeaderField.fileMode.readFrom(this.bytes, this.offset)!;
	}

	public set fileMode(value: number) {
		UstarHeaderField.fileMode.writeTo(this.bytes, this.offset, value);
	}

	public get ownerUserId(): number {
		return UstarHeaderField.ownerUserId.readFrom(this.bytes, this.offset)!;
	}

	public set ownerUserId(value: number) {
		UstarHeaderField.ownerUserId.writeTo(this.bytes, this.offset, value);
	}

	public get groupUserId(): number {
		return UstarHeaderField.groupUserId.readFrom(this.bytes, this.offset)!;
	}

	public set groupUserId(value: number) {
		UstarHeaderField.groupUserId.writeTo(this.bytes, this.offset, value);
	}

	public get fileSize(): number {
		return UstarHeaderField.fileSize.readFrom(this.bytes, this.offset)!;
	}

	public set fileSize(value: number) {
		UstarHeaderField.fileSize.writeTo(this.bytes, this.offset, value);
	}

	public get lastModified(): number {
		return UstarHeaderField.lastModified.readFrom(this.bytes, this.offset)!;
	}

	public set lastModified(value: number) {
		UstarHeaderField.lastModified.writeTo(this.bytes, this.offset, value);
	}

	public get headerChecksum(): number {
		return UstarHeaderField.headerChecksum.readFrom(this.bytes, this.offset)!;
	}

	public set headerChecksum(value: number) {
		UstarHeaderField.headerChecksum.writeTo(this.bytes, this.offset, value);
	}

	public get linkedFileName(): string {
		return UstarHeaderField.linkedFileName.readFrom(this.bytes, this.offset)!;
	}

	public set linkedFileName(value: string) {
		UstarHeaderField.linkedFileName.writeTo(this.bytes, this.offset, value);
	}

	public get typeFlag(): UstarHeaderLinkIndicatorType {
		return (UstarHeaderField.typeFlag.readFrom(this.bytes, this.offset) as UstarHeaderLinkIndicatorType)
			|| UstarHeaderLinkIndicatorType.UNKNOWN;
	}

	public set typeFlag(value: UstarHeaderLinkIndicatorType) {
		UstarHeaderField.typeFlag.writeTo(this.bytes, this.offset, value);
	}

	public get ustarIndicator(): string {
		return UstarHeaderField.ustarIndicator.readFrom(this.bytes, this.offset)!;
	}

	public get ustarVersion(): string {
		return UstarHeaderField.ustarVersion.readFrom(this.bytes, this.offset)!;
	}

	public set ustarVersion(value: string) {
		UstarHeaderField.ustarVersion.writeTo(this.bytes, this.offset, value);
	}

	public get ownerUserName(): string {
		return UstarHeaderField.ownerUserName.readFrom(this.bytes, this.offset)!;
	}

	public set ownerUserName(value: string) {
		UstarHeaderField.ownerUserName.writeTo(this.bytes, this.offset, value);
	}

	public get ownerGroupName(): string {
		return UstarHeaderField.ownerGroupName.readFrom(this.bytes, this.offset)!;
	}

	public set ownerGroupName(value: string) {
		UstarHeaderField.ownerGroupName.writeTo(this.bytes, this.offset, value);
	}

	public get deviceMajorNumber(): string {
		return UstarHeaderField.deviceMajorNumber.readFrom(this.bytes, this.offset)!;
	}

	public set deviceMajorNumber(value: string) {
		UstarHeaderField.deviceMajorNumber.writeTo(this.bytes, this.offset, value);
	}

	public get deviceMinorNumber(): string {
		return UstarHeaderField.deviceMinorNumber.readFrom(this.bytes, this.offset)!;
	}

	public set deviceMinorNumber(value: string) {
		UstarHeaderField.deviceMinorNumber.writeTo(this.bytes, this.offset, value);
	}

	public get fileNamePrefix(): string {
		return UstarHeaderField.fileNamePrefix.readFrom(this.bytes, this.offset)!;
	}

	public set fileNamePrefix(value: string) {
		UstarHeaderField.fileNamePrefix.writeTo(this.bytes, this.offset, value);
	}

	public get isPaxHeader(): boolean {
		return this.isLocalPaxHeader || this.isGlobalPaxHeader;
	}

	public get isGlobalPaxHeader(): boolean {
		return this.typeFlag === UstarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER;
	}

	public get isLocalPaxHeader(): boolean {
		return this.typeFlag === UstarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER;
	}

	public get isFileHeader(): boolean {
		return TarHeaderUtility.isTarHeaderLinkIndicatorTypeFile(this.typeFlag);
	}

	public get isDirectoryHeader(): boolean {
		return TarHeaderUtility.isTarHeaderLinkIndicatorTypeDirectory(this.typeFlag);
	}

	/**
	 * @returns A snapshot of the underlying buffer for this header
	 */
	public toUint8Array(): Uint8Array {
		return this.bytes.slice(this.offset, this.offset + Constants.HEADER_SIZE);
	}

	public toJSON(): Record<string, unknown> {
		const attributes = this.toAttributes();
		const {bytes, offset} = this;

		const buffer = {
			byteLength: bytes.byteLength,
			content: TarUtility.getDebugHexString(bytes)
		};

		return {
			offset,
			attributes,
			buffer
		};
	}

	public toAttributes(): UstarHeaderLike {
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

	/**
	 * Override all values in the header.
	 * Any values not provided in `attrs` will be filled in with default values.
	 * @returns `this` for operation chaining
	 */
	public initialize(attrs: UstarHeaderLike | Partial<UstarHeaderLike> = {}): this {
		const completeAttrs: UstarHeaderLike = Object.assign(UstarHeader.defaultValues(), (attrs || {}));
		this.update(completeAttrs);
		return this;
	}

	/**
	 * Ensures the state of the header is synced after changes have been made.
	 * @returns `this` for operation chaining
	 */
	public updateChecksum(): this {
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
	public update(attrs: UstarHeaderLike | Partial<UstarHeaderLike>): this {
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
			this.updateChecksum();
		}

		return this;
	}
}
