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
	private readonly mValueMap: Record<keyof UstarHeaderLike, any> = UstarHeader.defaultValues();

	constructor(attrs: Partial<UstarHeaderLike> = {}) {
		this.update(attrs);
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
	public static from(attrs: Partial<UstarHeaderLike>): UstarHeader {
		return UstarHeader.isUstarHeader(attrs) ? (attrs as UstarHeader) : new UstarHeader(attrs);
	}

	/**
	 * Short-hand for constructing a new `UstarHeader` and immediately calling `toUint8Array()` on it
	 */
	public static serialize(attrs: Partial<UstarHeaderLike>): Uint8Array {
		return UstarHeader.from(attrs).toUint8Array();
	}

	/**
	 * Parses out a UstarHeader instance from the given input buffer, at the given offset.
	 * The given offset must be a multiple of SECTOR_SIZE.
	 * 
	 * If the sector at the given offset is not marked with a ustar indicator,
	 * this will return null.
	 */
	public static deserialize(input: Uint8Array, offset: number = 0): UstarHeader {
		const attrs: Record<string, any> = {};

		for (const field of TarHeaderUtility.ALL_FIELDS) {
			attrs[field.name] = field.readFrom(input, offset);
		}

		return new UstarHeader(attrs);
	}

	public get fileName(): string {
		return this.mValueMap.fileName;
	}

	public set fileName(value: string) {
		this.mValueMap.fileName = value;
	}

	public get fileMode(): number {
		return this.mValueMap.fileMode;
	}

	public set fileMode(value: number) {
		this.mValueMap.fileMode = value;
	}

	public get ownerUserId(): number {
		return this.mValueMap.ownerUserId;
	}

	public set ownerUserId(value: number) {
		this.mValueMap.ownerUserId = value;
	}

	public get groupUserId(): number {
		return this.mValueMap.groupUserId;
	}

	public set groupUserId(value: number) {
		this.mValueMap.groupUserId = value;
	}

	public get fileSize(): number {
		return this.mValueMap.fileSize;
	}

	public set fileSize(value: number) {
		this.mValueMap.fileSize = value;
	}

	public get lastModified(): number {
		return this.mValueMap.lastModified;
	}

	public set lastModified(value: number) {
		this.mValueMap.lastModified = TarUtility.sanitizeDateTimeAsUstar(value);
	}

	public get headerChecksum(): number {
		return this.mValueMap.headerChecksum;
	}

	public set headerChecksum(value: number) {
		this.mValueMap.headerChecksum = value;
	}

	public get linkedFileName(): string {
		return this.mValueMap.linkedFileName;
	}

	public set linkedFileName(value: string) {
		this.mValueMap.linkedFileName = value;
	}

	public get typeFlag(): UstarHeaderLinkIndicatorType {
		return this.mValueMap.typeFlag;
	}

	public set typeFlag(value: UstarHeaderLinkIndicatorType) {
		this.mValueMap.typeFlag = value;
	}

	public get ustarIndicator(): string {
		return this.mValueMap.ustarIndicator;
	}

	public get ustarVersion(): string {
		return this.mValueMap.ustarVersion;
	}

	public set ustarVersion(value: string) {
		this.mValueMap.ustarVersion = value;
	}

	public get ownerUserName(): string {
		return this.mValueMap.ownerUserName;
	}

	public set ownerUserName(value: string) {
		this.mValueMap.ownerUserName = value;
	}

	public get ownerGroupName(): string {
		return this.mValueMap.ownerGroupName;
	}

	public set ownerGroupName(value: string) {
		this.mValueMap.ownerGroupName = value;
	}

	public get deviceMajorNumber(): string {
		return this.mValueMap.deviceMajorNumber;
	}

	public set deviceMajorNumber(value: string) {
		this.mValueMap.deviceMajorNumber = value;
	}

	public get deviceMinorNumber(): string {
		return this.mValueMap.deviceMinorNumber;
	}

	public set deviceMinorNumber(value: string) {
		this.mValueMap.deviceMinorNumber = value;
	}

	public get fileNamePrefix(): string {
		return this.mValueMap.fileNamePrefix;
	}

	public set fileNamePrefix(value: string) {
		this.mValueMap.fileNamePrefix = value;
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

	public update(attrs: Partial<UstarHeaderLike>): this {
		Object.assign(this.mValueMap, attrs);
		return this;
	}

	public toAttributes(): UstarHeaderLike {
		return Object.assign({}, this.mValueMap);
	}

	/**
	 * @returns A snapshot of the underlying buffer for this header
	 */
	public toUint8Array(): Uint8Array {
		const result = new Uint8Array(Constants.HEADER_SIZE);
		let checksum = TarHeaderUtility.CHECKSUM_SEED;

		for (const field of TarHeaderUtility.CHECKSUM_FIELDS) {
			field.writeTo(result, 0, this.mValueMap[field.name]);
			checksum += field.calculateChecksum(result);
		}

		this.headerChecksum = checksum;
		UstarHeaderField.headerChecksum.writeTo(result, 0, checksum);

		return result;
	}

	public toJSON(): Record<string, unknown> {
		const attributes = this.toAttributes();
		const bytes = this.toUint8Array();

		const buffer = {
			byteLength: bytes.byteLength,
			content: TarUtility.getDebugHexString(bytes)
		};

		return {
			attributes,
			buffer
		};
	}
}
