import { TarSerializable, TarUtility } from '../common/tar-utility';
import { PaxTarHeader, PaxTarHeaderAttributes } from './pax/pax-tar-header';
import { UstarHeader } from './ustar/ustar-header';
import { UstarHeaderField } from './ustar/ustar-header-field';
import { UstarHeaderLike } from './ustar/ustar-header-like';
import { UstarHeaderLinkIndicatorType } from './ustar/ustar-header-link-indicator-type';

export interface TarHeaderOptions {
	ustar: UstarHeader;
	pax?: PaxTarHeader;
	preamble?: UstarHeader;
	isPaxGlobal?: boolean;
}

/**
 * Facade over a backing Uint8Array buffer to consume/edit header data
 * at a specific location in the buffer.
 * 
 * Does not perform any mutations or reads on creation, and
 * lazy loads/sets data via getters and setters.
 */
export class TarHeader implements UstarHeaderLike, TarSerializable {
	public readonly ustar: UstarHeader;
	public readonly pax: PaxTarHeader | undefined;
	private mPreamble: UstarHeader | undefined;

	constructor(options: TarHeaderOptions) {
		const {ustar, pax, preamble, isPaxGlobal} = options;
		this.ustar = ustar;
		this.pax = pax;
		this.mPreamble = preamble;
		this.trySyncPaxHeader(!!isPaxGlobal);
	}

	public static isTarHeader(value: any): boolean {
		return !!(value && (value instanceof TarHeader));
	}

	/**
	 * @returns A new `TarHeader` instance populated with the content returned by `defaultValues()`
	 */
	public static seeded(): TarHeader {
		return TarHeader.from({});
	}

	/**
	 * @returns A new `TarHeader` instance based on the given attributes (if they are a POJO).
	 * Note that if the given value is already a TarHeader instance, this will return it as-is.
	 */
	public static from(attrs: Partial<UstarHeaderLike>): TarHeader {
		if (TarHeader.isTarHeader(attrs)) {
			return attrs as TarHeader;
		}

		const ustar = UstarHeader.from(attrs);
		const paxRequiredAttributes = TarHeader.collectPaxRequiredAttributes(attrs);
		let pax: PaxTarHeader | undefined;

		if (paxRequiredAttributes) {
			// The path property is the only reason we fall back to PAX as of now.
			// This block may need to be wrapped in a check for the path property if other attributes are added later on.
			const [directoryName, fileName] = TarHeader.splitBaseFileName(paxRequiredAttributes.path!);
			ustar.fileName = fileName;
			ustar.fileNamePrefix = directoryName;
			pax = PaxTarHeader.fromAttributes(paxRequiredAttributes);
		}

		return new TarHeader({ustar, pax});
	}

	/**
	 * Short-hand for constructing a new `TarHeader` and immediately calling `toUint8Array()` on it
	 */
	public static serialize(attrs: UstarHeaderLike | Partial<UstarHeaderLike>): Uint8Array {
		if (TarHeader.isTarHeader(attrs)) {
			return (attrs as TarHeader).toUint8Array();
		}

		return TarHeader.from(attrs).toUint8Array();
	}
	
	private static collectPaxRequiredAttributes(
		attrs: UstarHeaderLike | Partial<UstarHeaderLike>
	): Partial<PaxTarHeaderAttributes> | null {
		if (TarUtility.isObject(attrs)) {
			let collected: Partial<PaxTarHeaderAttributes> = {};

			if (attrs.fileName && attrs.fileName.length > UstarHeaderField.fileName.size) {
				collected.path = attrs.fileName;
			}
	
			if (Object.keys(collected).length > 0) {
				return collected;
			}
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

	public get preamble(): UstarHeader | undefined {
		return this.mPreamble;
	}

	public get byteLength(): number {
		const primary = this.ustar.byteLength;
		const pax = this.pax?.calculateSectorByteLength() ?? 0;
		const preamble = this.preamble?.byteLength ?? 0;
		return primary + pax + preamble;
	}

	public get fileName(): string {
		return this.pax?.path || this.ustar.fileName;
	}

	public get fileMode(): number {
		return this.ustar.fileMode;
	}

	public get ownerUserId(): number {
		return this.pax?.userId || this.ustar.ownerUserId;
	}

	public get groupUserId(): number {
		return this.pax?.groupId || this.ustar.groupUserId;
	}

	public get fileSize(): number {
		return this.pax?.size || this.ustar.fileSize;
	}

	public get lastModified(): number {
		return this.pax?.lastModified || this.ustar.lastModified;
	}

	public get headerChecksum(): number {
		return this.ustar.headerChecksum;
	}

	public get linkedFileName(): string {
		return this.pax?.linkPath || this.ustar.linkedFileName;
	}

	public get typeFlag(): UstarHeaderLinkIndicatorType {
		return this.ustar.typeFlag;
	}

	public get ustarIndicator(): string {
		return this.ustar.ustarIndicator;
	}

	public get ustarVersion(): string {
		return this.ustar.ustarVersion;
	}

	public get ownerUserName(): string {
		return this.pax?.userName || this.ustar.ownerUserName;
	}

	public get ownerGroupName(): string {
		return this.pax?.groupName || this.ustar.ownerGroupName;
	}

	public get deviceMajorNumber(): string {
		return this.ustar.deviceMajorNumber;
	}

	public get deviceMinorNumber(): string {
		return this.ustar.deviceMinorNumber;
	}

	public get fileNamePrefix(): string {
		return this.ustar.fileNamePrefix;
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
		return this.ustar.isGlobalPaxHeader;
	}

	public get isLocalPaxPreHeader(): boolean {
		return this.ustar.isLocalPaxHeader;
	}

	public get isGlobalPaxPostHeader(): boolean {
		return this.preamble?.isGlobalPaxHeader ?? false;
	}

	public get isLocalPaxPostHeader(): boolean {
		return this.preamble?.isLocalPaxHeader ?? false;
	}

	public get isFileHeader(): boolean {
		return this.ustar.isFileHeader;
	}

	public get isDirectoryHeader(): boolean {
		return this.ustar.isDirectoryHeader;
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
	 * Ensures that things such as checksum values are
	 * synchronized with the current underlying header states.
	 * 
	 * @returns `this` for operation chaining
	 */
	public normalize(): this {
		this.ustar.updateChecksum();
		this.preamble?.updateChecksum();
		return this;
	}

	/**
	 * @returns A snapshot of the underlying buffer for this header
	 */
	public toUint8Array(): Uint8Array {
		const isPax = !!(this.isPaxHeader && this.pax && this.preamble);

		if (!isPax) {
			return this.ustar.bytes;
		}

		const preambleBytes = this.preamble!.bytes;
		const paxBytes = this.pax!.toUint8ArrayPadded();
		const ownBytes = this.ustar.bytes;
		const totalSize = preambleBytes.byteLength + paxBytes.byteLength + ownBytes.byteLength;
		const result = new Uint8Array(totalSize);
		let offset = 0;

		result.set(this.preamble!.bytes, offset);
		offset += preambleBytes.byteLength;

		result.set(paxBytes, offset);
		offset += paxBytes.byteLength;

		result.set(ownBytes, offset);

		return result;
	}

	public toJSON(): Record<string, unknown> {
		const attributes = this.ustar.toAttributes();
		const {pax, preamble, ustar} = this;
		const {bytes, offset} = ustar;

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

	private trySyncPaxHeader(isPaxGlobal: boolean): void {
		if (!this.pax || this.preamble) {
			return;
		}

		const fileName = this.fileName;
		const fileSize = this.pax.calculateByteLength();
		const lastModified = this.pax.lastModified;
		const typeFlag = isPaxGlobal
			? UstarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER
			: UstarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER;

		this.mPreamble = UstarHeader.from({
			fileName,
			typeFlag,
			lastModified,
			fileSize
		});
	}
}
