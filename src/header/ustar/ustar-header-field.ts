import { Constants } from '../../common/constants';
import { TarUtility } from '../../common/tar-utility';
import { UstarHeaderFieldTransform, UstarHeaderFieldTransformType } from './ustar-header-field-transform';
import { UstarHeaderFieldType } from './ustar-header-field-type';
import { UstarHeaderLike } from './ustar-header-like';

/**
 * Metadata about a single field for a tar header.
 * These are used to dynamically parse fields as a header sector is stepped through.
 *
 * See extractTarEntry() and TarUtility for more info.
 */
export interface UstarHeaderFieldLike {
	readonly name: keyof UstarHeaderLike;
	readonly offset: number;
	readonly size: number;
	readonly type: UstarHeaderFieldType;
	constantValue?: any;
}

/**
 * Definitions taken from here:
 * https://en.wikipedia.org/wiki/Tar_(computing)
 */
export class UstarHeaderField<T> implements UstarHeaderFieldLike {
	public readonly name: keyof UstarHeaderLike;
	public readonly offset: number;
	public readonly size: number;
	public readonly type: UstarHeaderFieldType;
	public readonly constantValue: any;
	public readonly transform: UstarHeaderFieldTransform<T>;

	constructor(config: UstarHeaderFieldLike) {
		this.name = config.name;
		this.offset = config.offset;
		this.size = config.size;
		this.type = config.type;
		this.constantValue = config.constantValue || undefined;
		this.transform = UstarHeaderFieldTransformType.from(this.type)!;
	}

	public static frozen<T>(config: UstarHeaderFieldLike): UstarHeaderField<T> {
		return Object.freeze(new UstarHeaderField<T>(config));
	}

	// =====================================================================
	// Legacy Fields
	// =====================================================================

	public static readonly fileName: UstarHeaderField<string> = UstarHeaderField.frozen({
		name: 'fileName',
		offset: 0,
		size: 100,
		type: UstarHeaderFieldType.ASCII_PADDED_END,
	});

	public static readonly fileMode: UstarHeaderField<number> = UstarHeaderField.frozen({
		name: 'fileMode',
		offset: 100,
		size: 8,
		type: UstarHeaderFieldType.INTEGER_OCTAL,
	});

	public static readonly ownerUserId: UstarHeaderField<number> = UstarHeaderField.frozen({
		name: 'ownerUserId',
		offset: 108,
		size: 8,
		type: UstarHeaderFieldType.INTEGER_OCTAL,
	});

	public static readonly groupUserId: UstarHeaderField<number> = UstarHeaderField.frozen({
		name: 'groupUserId',
		offset: 116,
		size: 8,
		type: UstarHeaderFieldType.INTEGER_OCTAL,
	});

	public static readonly fileSize: UstarHeaderField<number> = UstarHeaderField.frozen({
		name: 'fileSize',
		offset: 124,
		size: 12,
		type: UstarHeaderFieldType.INTEGER_OCTAL,
	});

	public static readonly lastModified: UstarHeaderField<number> = UstarHeaderField.frozen({
		name: 'lastModified',
		offset: 136,
		size: 12,
		type: UstarHeaderFieldType.INTEGER_OCTAL_TIMESTAMP,
	});

	public static readonly headerChecksum: UstarHeaderField<number> = UstarHeaderField.frozen({
		name: 'headerChecksum',
		offset: 148,
		size: 8,
		type: UstarHeaderFieldType.INTEGER_OCTAL,
	});

	public static readonly typeFlag: UstarHeaderField<string> = UstarHeaderField.frozen({
		name: 'typeFlag',
		offset: 156,
		size: 1,
		type: UstarHeaderFieldType.ASCII,
	});

	public static readonly linkedFileName: UstarHeaderField<string> = UstarHeaderField.frozen({
		name: 'linkedFileName',
		offset: 157,
		size: 100,
		type: UstarHeaderFieldType.ASCII_PADDED_END,
	});

	// =====================================================================
	// USTAR Fields
	// =====================================================================

	public static readonly ustarIndicator: UstarHeaderField<string> = UstarHeaderField.frozen({
		name: 'ustarIndicator',
		offset: 257,
		size: 6,
		type: UstarHeaderFieldType.ASCII,
		constantValue: Constants.USTAR_INDICATOR_VALUE,
	});

	public static readonly ustarVersion: UstarHeaderField<string> = UstarHeaderField.frozen({
		name: 'ustarVersion',
		offset: 263,
		size: 2,
		type: UstarHeaderFieldType.ASCII,
		constantValue: Constants.USTAR_VERSION_VALUE,
	});

	public static readonly ownerUserName: UstarHeaderField<string> = UstarHeaderField.frozen({
		name: 'ownerUserName',
		offset: 265,
		size: 32,
		type: UstarHeaderFieldType.ASCII_PADDED_END,
	});

	public static readonly ownerGroupName: UstarHeaderField<string> = UstarHeaderField.frozen({
		name: 'ownerGroupName',
		offset: 297,
		size: 32,
		type: UstarHeaderFieldType.ASCII_PADDED_END,
	});

	public static readonly deviceMajorNumber: UstarHeaderField<string> = UstarHeaderField.frozen({
		name: 'deviceMajorNumber',
		offset: 329,
		size: 8,
		type: UstarHeaderFieldType.ASCII_PADDED_END,
	});

	public static readonly deviceMinorNumber: UstarHeaderField<string> = UstarHeaderField.frozen({
		name: 'deviceMinorNumber',
		offset: 337,
		size: 8,
		type: UstarHeaderFieldType.ASCII_PADDED_END,
	});

	public static readonly fileNamePrefix: UstarHeaderField<string> = UstarHeaderField.frozen({
		name: 'fileNamePrefix',
		offset: 345,
		size: 155,
		type: UstarHeaderFieldType.ASCII_PADDED_END,
	});

	public static all(): UstarHeaderField<any>[] {
		return [
			UstarHeaderField.fileName,
			UstarHeaderField.fileMode,
			UstarHeaderField.ownerUserId,
			UstarHeaderField.groupUserId,
			UstarHeaderField.fileSize,
			UstarHeaderField.lastModified,
			UstarHeaderField.headerChecksum,
			UstarHeaderField.typeFlag,
			UstarHeaderField.linkedFileName,
			UstarHeaderField.ustarIndicator,
			UstarHeaderField.ustarVersion,
			UstarHeaderField.ownerUserName,
			UstarHeaderField.ownerGroupName,
			UstarHeaderField.deviceMajorNumber,
			UstarHeaderField.deviceMinorNumber,
			UstarHeaderField.fileNamePrefix,
		];
	}

	public static checksumSet(): UstarHeaderField<any>[] {
		return UstarHeaderField.all().filter((v) => v !== UstarHeaderField.headerChecksum);
	}

	// =====================================================================
	// Instance Methods
	// =====================================================================

	/**
	 * Shorthand for padding the output of `slice` into `decodeString`.
	 */
	public sliceString(input: Uint8Array, offset?: number): string {
		return TarUtility.decodeString(this.slice(input, offset));
	}

	/**
	 * @param input - a buffer of one or more complete tar sectors
	 * @param offset - the offset to slice from (must be a multiple of `SECTOR_SIZE`)
	 * @returns the slice of the given input Uint8Array that this field resides in.
	 */
	public slice(input: Uint8Array, offset: number = 0): Uint8Array {
		if (!TarUtility.isUint8Array(input)) {
			return new Uint8Array(0);
		}

		const start = offset + this.offset;
		const end = start + this.size;
		return input.slice(start, end);
	}

	/**
	 * @param input - a buffer of one or more complete tar sectors
	 * @returns The value parsed from the input based on this field's transform type,
	 * or `undefined` on error.
	 */
	public deserialize(input: Uint8Array, offset: number = 0): T | undefined {
		if (TarUtility.isUint8Array(input)) {
			return this.transform.deserialize(input, this.size, offset);
		}

		return undefined;
	}

	/**
	 * @param input - the value to be serialized, based on this field's transform type.
	 * @returns the serialized value as a Uint8Array
	 */
	public serialize(input: T): Uint8Array {
		const result = new Uint8Array(this.size);
		const value = this.transform.serialize(input, this.size);
		result.set(value, 0);
		return result;
	}

	/**
	 * Runs `deserialize()` while also taking this field's offset into account.
	 */
	public readFrom(input: Uint8Array, offset: number): T | undefined {
		return this.deserialize(input, offset + this.offset);
	}

	/**
	 * Serialize the given value and set the output bytes in the given output buffer.
	 * @param output - the output buffer to be written to
	 * @param headerOffset - the offset of the header in the output buffer to insert the update.
	 * 		Note that this field's offset will be added to the header offset when inserting.
	 * @param value - the value to be serialized
	 * @returns true if the buffer was updated
	 */
	public writeTo(output: Uint8Array, headerOffset: number, value: T): boolean {
		headerOffset = Math.max(headerOffset, 0);

		const valueBytes = this.serialize(value);
		const valueByteLength = valueBytes.byteLength;
		const absoluteOffset = headerOffset + this.offset;

		if (
			valueByteLength > 0 &&
			TarUtility.isUint8Array(output) &&
			output.byteLength >= absoluteOffset + valueByteLength
		) {
			output.set(valueBytes, absoluteOffset);
			return true;
		}

		return false;
	}

	/**
	 * Calculates the checksum value for this field in the given input buffer, at the given offset.
	 * All field checksum values are aggregated together to form the main header checksum entry.
	 * @param input - the input buffer to extract a field checksum from
	 * @param offset - the offset of the header in the buffer (will be combined with this field's offset)
	 * @returns the checksum value for this specific field
	 */
	public calculateChecksum(input: Uint8Array, offset: number = 0): number {
		let checksum = 0;

		if (!TarUtility.isUint8Array(input)) {
			return checksum;
		}

		const start = offset + this.offset;
		const end = start + this.size;

		for (let i = start; i < end; i++) {
			checksum += input[i];
		}

		return checksum;
	}
}
