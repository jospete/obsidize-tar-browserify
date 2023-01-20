import { concatUint8Arrays, getSectorOffsetDelta, SECTOR_SIZE, sizeofUint8Array } from '../common';
import { TarHeader, TarHeaderUtility } from '../header';

export interface TarEntryAttributesLike {
	header: Partial<TarHeader>;
	content?: Uint8Array | null;
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

	public static combine(snapshots: TarEntryAttributes[]): Uint8Array {
		return snapshots.reduce((acc, attrs) => attrs.appendTo(acc), new Uint8Array(0));
	}

	public static combinePadded(snapshots: TarEntryAttributes[]): Uint8Array {
		return concatUint8Arrays(
			TarEntryAttributes.combine(snapshots),
			new Uint8Array(SECTOR_SIZE * 2)
		);
	}

	public static combinePaddedFrom(snapshots: TarEntryAttributesLike[]): Uint8Array {
		const safeSnapshots = Array.from(snapshots)
			.filter(v => !!v)
			.map(v => TarEntryAttributes.from(v));
		return TarEntryAttributes.combinePadded(safeSnapshots);
	}

	public appendTo(accumulatedBuffer: Uint8Array): Uint8Array {
		return concatUint8Arrays(accumulatedBuffer, this.toUint8Array());
	}

	public toUint8Array(): Uint8Array {

		const { header, content } = this;
		const contentSize = sizeofUint8Array(content);
		const offsetDelta = getSectorOffsetDelta(contentSize);

		let paddedContent = content!;

		if (contentSize > 0 && offsetDelta > 0) {
			paddedContent = concatUint8Arrays(content!, new Uint8Array(offsetDelta));
		}

		const safeHeader = TarHeaderUtility.sanitizeHeader(header);
		safeHeader.fileSize = contentSize;

		const headerBuffer = TarHeaderUtility.generateHeaderBuffer(safeHeader);
		return concatUint8Arrays(headerBuffer, paddedContent);
	}
}