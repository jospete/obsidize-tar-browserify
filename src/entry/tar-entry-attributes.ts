import { SECTOR_SIZE } from '../common/constants';
import { concatUint8Arrays, getSectorOffsetDelta, sizeofUint8Array } from '../common/transforms';
import { TarHeader } from '../header/tar-header';
import { sanitizeHeader, TarHeaderMetadata } from '../header/tar-header-metadata';

export interface TarEntryAttributesLike {
	header: Partial<TarHeader>;
	content?: Uint8Array | null;
}

function concatAttributes(accumulator: Uint8Array, attrs: TarEntryAttributes): Uint8Array {
	return concatUint8Arrays(accumulator, attrs.toUint8Array());
}

/**
 * Deflated snapshot of an entry with _no_ metadata built-in.
 * Counterpart to `TarEntryMetadata`.
 */
export class TarEntryAttributes implements TarEntryAttributesLike {

	constructor(
		public readonly header: Partial<TarHeader>,
		public readonly content: Uint8Array | null = null
	) {
	}

	public static from(value: TarEntryAttributesLike): TarEntryAttributes {
		const { header, content } = value;
		return new TarEntryAttributes(header, content);
	}

	public static fromMany(values: TarEntryAttributesLike[]): TarEntryAttributes[] {
		return Array.from(values).filter(v => !!v).map(v => TarEntryAttributes.from(v));
	}

	public static combine(snapshots: TarEntryAttributes[]): Uint8Array {
		return snapshots.reduce(concatAttributes, new Uint8Array(0));
	}

	public static combinePadded(snapshots: TarEntryAttributes[]): Uint8Array {
		const padBuffer = new Uint8Array(SECTOR_SIZE * 2);
		return concatUint8Arrays(TarEntryAttributes.combine(snapshots), padBuffer);
	}

	public static combinePaddedFrom(snapshots: TarEntryAttributesLike[]): Uint8Array {
		const parsedAttrs = TarEntryAttributes.fromMany(snapshots);
		return TarEntryAttributes.combinePadded(parsedAttrs);
	}

	public toUint8Array(): Uint8Array {

		const { header, content } = this;
		const contentSize = sizeofUint8Array(content);
		const offsetDelta = getSectorOffsetDelta(contentSize);

		let paddedContent = content!;

		if (contentSize > 0 && offsetDelta > 0) {
			paddedContent = concatUint8Arrays(content!, new Uint8Array(offsetDelta));
		}

		const safeHeader = sanitizeHeader(header);
		safeHeader.fileSize = contentSize;

		const headerBuffer = TarHeaderMetadata.serialize(safeHeader);
		return concatUint8Arrays(headerBuffer, paddedContent);
	}
}