import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeaderField } from './tar-header-field';
import { TarHeaderLike } from './tar-header-like';
import { TarHeaderLinkIndicatorType } from './tar-header-link-indicator-type';
import { TarHeaderUtility } from './tar-header-utility';

/**
 * Facade over a backing Uint8Array buffer to consume/edit header data
 * at a specific location in the buffer.
 * 
 * Does not perform any mutations or reads on creation, and
 * lazy loads/sets data via getters and setters.
 */
export class TarHeader implements TarHeaderLike {

	constructor(
		public readonly bytes: Uint8Array = new Uint8Array(Constants.HEADER_SIZE), 
		public readonly offset: number = 0
	) {
	}

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

	public static from(attrs: TarHeaderLike | Partial<TarHeaderLike>): TarHeader {

		if (TarHeader.isTarHeader(attrs)) {
			return attrs as TarHeader;
		}

		return new TarHeader().initialize(attrs);
	}

	public static slice(input: Uint8Array, offset: number): TarHeader {

		if (TarUtility.isUint8Array(input)) {
			return new TarHeader(input.slice(offset, offset + Constants.HEADER_SIZE));
		}

		return new TarHeader();
	}

	public static serialize(attrs: TarHeaderLike | Partial<TarHeaderLike>): Uint8Array {

		if (TarHeader.isTarHeader(attrs)) {
			return (attrs as TarHeader).toUint8Array();
		}

		return TarHeader.from(attrs).toUint8Array();
	}

	public static seeded(): TarHeader {
		return TarHeader.from({});
	}

	public get fileName(): string {
		return TarHeaderField.fileName.extract(this.bytes, this.offset)!;
	}

	public set fileName(value: string) {
		TarHeaderField.fileName.inject(this.bytes, this.offset, value);
	}

	public get fileMode(): number {
		return TarHeaderField.fileMode.extract(this.bytes, this.offset)!;
	}

	public set fileMode(value: number) {
		TarHeaderField.fileMode.inject(this.bytes, this.offset, value);
	}

	public get ownerUserId(): number {
		return TarHeaderField.ownerUserId.extract(this.bytes, this.offset)!;
	}

	public set ownerUserId(value: number) {
		TarHeaderField.ownerUserId.inject(this.bytes, this.offset, value);
	}

	public get groupUserId(): number {
		return TarHeaderField.groupUserId.extract(this.bytes, this.offset)!;
	}

	public set groupUserId(value: number) {
		TarHeaderField.groupUserId.inject(this.bytes, this.offset, value);
	}

	public get fileSize(): number {
		return TarHeaderField.fileSize.extract(this.bytes, this.offset)!;
	}

	public set fileSize(value: number) {
		TarHeaderField.fileSize.inject(this.bytes, this.offset, value);
	}

	public get lastModified(): number {
		return TarHeaderField.lastModified.extract(this.bytes, this.offset)!;
	}

	public set lastModified(value: number) {
		TarHeaderField.lastModified.inject(this.bytes, this.offset, value);
	}

	public get headerChecksum(): number {
		return TarHeaderField.headerChecksum.extract(this.bytes, this.offset)!;
	}

	public set headerChecksum(value: number) {
		TarHeaderField.headerChecksum.inject(this.bytes, this.offset, value);
	}

	public get linkedFileName(): string {
		return TarHeaderField.linkedFileName.extract(this.bytes, this.offset)!;
	}

	public set linkedFileName(value: string) {
		TarHeaderField.linkedFileName.inject(this.bytes, this.offset, value);
	}

	public get typeFlag(): TarHeaderLinkIndicatorType {
		return (TarHeaderField.typeFlag.extract(this.bytes, this.offset) as TarHeaderLinkIndicatorType)
			|| TarHeaderLinkIndicatorType.UNKNOWN;
	}

	public set typeFlag(value: TarHeaderLinkIndicatorType) {
		TarHeaderField.typeFlag.inject(this.bytes, this.offset, value);
	}

	public get ustarIndicator(): string {
		return TarHeaderField.ustarIndicator.extract(this.bytes, this.offset)!;
	}

	public get ustarVersion(): string {
		return TarHeaderField.ustarVersion.extract(this.bytes, this.offset)!;
	}

	public set ustarVersion(value: string) {
		TarHeaderField.ustarVersion.inject(this.bytes, this.offset, value);
	}

	public get ownerUserName(): string {
		return TarHeaderField.ownerUserName.extract(this.bytes, this.offset)!;
	}

	public set ownerUserName(value: string) {
		TarHeaderField.ownerUserName.inject(this.bytes, this.offset, value);
	}

	public get ownerGroupName(): string {
		return TarHeaderField.ownerGroupName.extract(this.bytes, this.offset)!;
	}

	public set ownerGroupName(value: string) {
		TarHeaderField.ownerGroupName.inject(this.bytes, this.offset, value);
	}

	public get deviceMajorNumber(): string {
		return TarHeaderField.deviceMajorNumber.extract(this.bytes, this.offset)!;
	}

	public set deviceMajorNumber(value: string) {
		TarHeaderField.deviceMajorNumber.inject(this.bytes, this.offset, value);
	}

	public get deviceMinorNumber(): string {
		return TarHeaderField.deviceMinorNumber.extract(this.bytes, this.offset)!;
	}

	public set deviceMinorNumber(value: string) {
		TarHeaderField.deviceMinorNumber.inject(this.bytes, this.offset, value);
	}

	public get fileNamePrefix(): string {
		return TarHeaderField.fileNamePrefix.extract(this.bytes, this.offset)!;
	}

	public set fileNamePrefix(value: string) {
		TarHeaderField.fileNamePrefix.inject(this.bytes, this.offset, value);
	}

	public toUint8Array(): Uint8Array {
		return this.bytes.slice(this.offset, this.offset + Constants.HEADER_SIZE);
	}

	public initialize(attrs: TarHeaderLike | Partial<TarHeaderLike> = {}): this {
		const completeAttrs = TarHeader.defaultValues();
		Object.assign(completeAttrs, (attrs || {}));
		return this.update(completeAttrs);
	}

	public normalize(): this {
		this.lastModified = TarUtility.sanitizeTimestamp(this.lastModified!);
		return this.normalizeChecksum();
	}

	public normalizeChecksum(): this {

		let checksum = TarHeaderUtility.CHECKSUM_SEED;

		for (const field of TarHeaderUtility.CHECKSUM_FIELDS) {
			checksum += field.calculateChecksum(this.bytes, this.offset);
		}

		this.headerChecksum = checksum;

		return this;
	}

	public update(attrs: TarHeaderLike | Partial<TarHeaderLike>): this {

		if (!attrs) {
			return this;
		}
		
		let didModifyAnyField = false;

		for (const field of TarHeaderUtility.ALL_FIELDS) {
			const value = (attrs as any)[field.name];

			if (TarUtility.isDefined(value)) {
				const modified = field.inject(this.bytes, this.offset, value);
				didModifyAnyField = didModifyAnyField || modified;
			}
		}

		if (didModifyAnyField) {
			this.normalize();
		}

		return this;
	}
}