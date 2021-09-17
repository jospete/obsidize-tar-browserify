import { TarHeader, TarHeaderFieldDefinition } from './tar-header';
import { TarUtility } from './tar-utility';

const {
	SECTOR_SIZE,
	USTAR_INDICATOR_VALUE,
	USTAR_VERSION_VALUE,
	isUint8Array,
	unparseFieldValue,
	concatUint8Arrays,
	roundUpSectorOffset
} = TarUtility;

/**
 * Collection of utility functions for generating a single unified tar buffer.
 */
export namespace TarSerializeUtility {

	/**
	 * Creates the static content that goes at the end of the tar file.
	 */
	export function createTarFileEndingSectors(): Uint8Array {
		const size = SECTOR_SIZE * 2;
		const result = new Uint8Array(size);
		result.fill(0, 0, size);
		return result;
	}

	/**
	 * Generates a single unified tar buffer that can be written out as a *.tar file.
	 */
	export function createTarEntryBuffer(header: TarHeader, content: Uint8Array): Uint8Array {
		return concatUint8Arrays([
			createTarHeaderSector(header),
			createTarFileContentSector(content)
		]);
	}

	/**
	 * Overwrites the USTAR properties in the header with static content, per the wiki.
	 */
	export function ensureTarHeaderIsUstarFormat(header: TarHeader): TarHeader {
		const { ustarIndicator, ustarVersion } = TarHeaderFieldDefinition;
		return Object.assign(header, {
			[ustarIndicator().name]: USTAR_INDICATOR_VALUE,
			[ustarVersion().name]: USTAR_VERSION_VALUE
		});
	}

	/**
	 * Performs any necessary padding on the given content to ensure it fits within a set of tar sectors.
	 */
	export function createTarFileContentSector(content: Uint8Array, padValue: number = 0): Uint8Array {

		if (!isUint8Array(content)) return content;

		const contentSize = content.byteLength;
		const resultSize = roundUpSectorOffset(contentSize);

		if (resultSize === contentSize) return content;

		const result = new Uint8Array(resultSize);

		result.set(content, 0);
		result.fill(padValue, contentSize, resultSize);

		return result;
	}

	/**
	 * Encodes the fields of the given header into a header sector.
	 */
	export function createTarHeaderSector(header: TarHeader, padValue: number = 0): Uint8Array {

		const resultSize = SECTOR_SIZE;
		const result = new Uint8Array(resultSize);
		const fields = TarHeaderFieldDefinition.orderedSet();

		let maxContentOffset = 0;

		if (header) {

			const sanitizedHeader = ensureTarHeaderIsUstarFormat(header);

			for (const field of fields) {

				const { name, offset, size } = field;
				const fieldMaxOffset = offset + size;

				if (fieldMaxOffset > resultSize) continue;

				const valueBytes = unparseFieldValue(field, sanitizedHeader[name]);
				result.set(valueBytes, offset);
				maxContentOffset = Math.max(maxContentOffset, fieldMaxOffset);
			}
		}

		if (maxContentOffset < resultSize) {
			result.fill(padValue, maxContentOffset, resultSize);
		}

		return result;
	}
}