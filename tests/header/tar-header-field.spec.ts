import {
	Constants,
	HeaderFieldDefinitions,
	serializeIntegerOctalWithSuffix,
	TarHeaderFieldMetadata,
	TarHeaderFieldType,
	TarHeaderMetadata,
	TarUtility
} from '../../src';

const {
	encodeString,
	sanitizeTimestamp,
} = TarUtility;

const {
	USTAR_TAG
} = Constants;

const {
	fileMode,
	fileName,
	fileSize,
	lastModified,
	ustarIndicator,
	isUstarSector
} = HeaderFieldDefinitions;

import { range } from '../util';

describe('TarHeaderField', () => {

	it('is a collection of header metadata options to streamline tar header parsing', () => {
		expect(fileName.type).toBe(TarHeaderFieldType.ASCII_PADDED_END);
	});

	describe('isUstarSector()', () => {

		it('returns true if the buffer contains a ustar indicator', () => {
			const testHeaderBuffer = TarHeaderMetadata.serialize(null);
			expect(isUstarSector(testHeaderBuffer)).toBe(true);
		});

		it('returns false if the buffer does NOT contain a ustar indicator', () => {
			expect(isUstarSector(null as any)).toBe(false);
			expect(isUstarSector(new Uint8Array(0))).toBe(false);
		});

		it('allows for non-standard padding after ustar indicator header data', () => {

			const targetOffset = ustarIndicator.offset;
			const testHeaderBuffer = TarHeaderMetadata.serialize(null);
			const baseValue = USTAR_TAG;

			const assertValidHeader = (value: string, isValid: boolean) => {
				testHeaderBuffer.set(encodeString(value), targetOffset);
				expect(isUstarSector(testHeaderBuffer)).toBe(isValid);
			};

			assertValidHeader('\0\0\0\0\0\0\0\0', false);
			assertValidHeader(baseValue, true);

			// some older tar creation tools add spacing after "ustar", so need to account for that
			assertValidHeader(`${baseValue}\0`, true);
			assertValidHeader(`${baseValue} \0`, true);
			assertValidHeader(`${baseValue}  \0`, true);
			assertValidHeader(`${baseValue}  `, true);

			// make sure we can go back to failed state because paranoia
			assertValidHeader('\0\0\0\0\0\0\0\0', false);
		});
	});

	describe('slice()', () => {

		it('defaults to offset zero when no offset is provided', () => {
			const buffer = Uint8Array.from(range(0x1FF));
			const headerField = fileSize;
			const slicedBuffer = headerField.slice(buffer);
			const sliceStart = headerField.offset;
			const sliceEnd = sliceStart + headerField.size;
			expect(slicedBuffer).toEqual(buffer.slice(sliceStart, sliceEnd));
		});
	});

	describe('serialize()', () => {

		it('interprets the given value based on the given field metadata', () => {
			const valueOctal = '777';
			const value = parseInt(valueOctal, 8);
			const field = fileMode;
			const fieldValue = field.serialize(value);
			expect(field.deserialize(fieldValue)).toBe(value);
		});

		it('decodes mtime values to proper Date timestamps', () => {
			const now = sanitizeTimestamp(Date.now());
			const field = lastModified;
			const fieldValue = field.serialize(now);
			expect(field.deserialize(fieldValue)).toBe(now);
		});

		it('does not explode when given malformed input', () => {
			expect(() => lastModified.serialize(null)).not.toThrowError();
		});
	});

	describe('deserialize()', () => {

		const defaultHeader = new TarHeaderMetadata();
		const fields: TarHeaderFieldMetadata<any>[] = Object.values(defaultHeader);

		for (const fieldMeta of fields) {

			const field = fieldMeta.field;
			const serialized = field.serialize(fieldMeta.value);
			const deserialized = field.deserialize(serialized);

			it(`mirrors the serialized value for "${field.name}"`, () => {
				expect(serialized).toEqual(fieldMeta.bytes);
			});

			it(`mirrors the deserialized value for "${field.name}"`, () => {
				expect(deserialized).toEqual(fieldMeta.value);
			});
		}

		it('returns undefined when given malformed input', () => {
			let value: any = null;
			expect(() => value = lastModified.deserialize(null as any)).not.toThrowError();
			expect(value).not.toBeDefined();
		});
	});

	describe('serializeIntegerOctalWithSuffix()', () => {

		it('uses a default min length of zero when a field is not given', () => {
			expect(serializeIntegerOctalWithSuffix(0, null as any, ''))
				.toEqual(encodeString('0'));
		});
	});
});