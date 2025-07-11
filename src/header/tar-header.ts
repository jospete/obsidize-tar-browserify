import { TarSerializable, TarUtility } from '../common/tar-utility';
import { PaxHeader, PaxHeaderAttributes } from './pax/pax-header';
import { UstarHeader } from './ustar/ustar-header';
import { UstarHeaderField } from './ustar/ustar-header-field';
import { UstarHeaderLike } from './ustar/ustar-header-like';
import { UstarHeaderLinkIndicatorType } from './ustar/ustar-header-link-indicator-type';

export interface TarHeaderOptions {
	ustar: UstarHeader;
	pax?: PaxHeader;
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
	public readonly pax: PaxHeader | undefined;
	private mPreamble: UstarHeader | undefined;
	private mIsGlobal: boolean;

	constructor(options: TarHeaderOptions) {
		const {ustar, pax, preamble, isPaxGlobal} = options;
		this.ustar = ustar;
		this.pax = pax;
		this.mPreamble = preamble;
		this.mIsGlobal = !!isPaxGlobal;
		this.trySyncPaxHeader();
	}

	public static isTarHeader(value: any): boolean {
		return !!(value && (value instanceof TarHeader));
	}

	/**
	 * @returns A new `TarHeader` instance based on the given attributes (if they are a POJO).
	 * Note that if the given value is already a TarHeader instance, this will return it as-is.
	 */
	public static fromAttributes(attributes: Partial<UstarHeaderLike>): TarHeader {
		if (TarHeader.isTarHeader(attributes)) {
			return attributes as TarHeader;
		}

		const ustar = new UstarHeader(attributes);
		const paxRequiredAttributes = TarHeader.collectPaxRequiredAttributes(attributes);
		let pax: PaxHeader | undefined;

		if (paxRequiredAttributes) {
			// The path property is the only reason we fall back to PAX as of now.
			// This block may need to be wrapped in a check for the path property if other attributes are added later on.
			const [directoryName, fileName] = TarHeader.splitBaseFileName(paxRequiredAttributes.path!);
			ustar.fileName = fileName;
			ustar.fileNamePrefix = directoryName;
			pax = PaxHeader.fromAttributes(paxRequiredAttributes);
		}

		return new TarHeader({ustar, pax});
	}

	/**
	 * Short-hand for constructing a new `TarHeader` and immediately calling `toUint8Array()` on it
	 */
	public static serializeAttributes(attributes: Partial<UstarHeaderLike>): Uint8Array {
		if (TarHeader.isTarHeader(attributes)) {
			return (attributes as TarHeader).toUint8Array();
		}

		return TarHeader.fromAttributes(attributes).toUint8Array();
	}
	
	private static collectPaxRequiredAttributes(
		attrs: UstarHeaderLike | Partial<UstarHeaderLike>
	): Partial<PaxHeaderAttributes> | null {
		if (TarUtility.isObject(attrs)) {
			let collected: Partial<PaxHeaderAttributes> = {};

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
	 * See also `PaxHeader.clean()`.
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
	private normalize(): this {
		this.trySyncPaxHeader();
		return this;
	}

	/**
	 * @returns A snapshot of the underlying buffer for this header
	 */
	public toUint8Array(): Uint8Array {
		this.normalize();
		
		const isPax = !!(this.isPaxHeader && this.pax && this.preamble);

		if (!isPax) {
			return this.ustar.toUint8Array();
		}

		const preambleBytes = this.preamble!.toUint8Array();
		const paxBytes = this.pax!.toUint8ArrayPadded();
		const ownBytes = this.ustar.toUint8Array();
		const totalSize = preambleBytes.byteLength + paxBytes.byteLength + ownBytes.byteLength;
		const result = new Uint8Array(totalSize);
		let offset = 0;

		result.set(preambleBytes, offset);
		offset += preambleBytes.byteLength;

		result.set(paxBytes, offset);
		offset += paxBytes.byteLength;

		result.set(ownBytes, offset);

		return result;
	}

	public toJSON(): Record<string, unknown> {
		const {pax, preamble, ustar} = this;
		return {preamble, pax, ustar};
	}

	private trySyncPaxHeader(): void {
		if (!this.pax) {
			return;
		}

		const fileName = this.fileName;
		const fileSize = this.pax.toUint8Array().byteLength;
		const lastModified = this.pax.lastModified;
		const typeFlag = this.mIsGlobal
			? UstarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER
			: UstarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER;

		const preambleAttrs = {
			fileName,
			typeFlag,
			lastModified,
			fileSize
		};

		if (this.mPreamble) {
			this.mPreamble.update(preambleAttrs);

		} else {
			this.mPreamble = new UstarHeader(preambleAttrs);
		}
	}
}
