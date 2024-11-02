import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { TarHeader } from '../header/tar-header';
import { TarHeaderField } from '../header/tar-header-field';
import { TarHeaderFieldType } from '../header/tar-header-field-type';
import { TarHeaderUtility } from '../header/tar-header-utility';
import { range } from '../test/test-util';

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
	ustarIndicator
} = TarHeaderField;

const {
	isUstarSector
} = TarHeaderUtility;

describe('TarHeaderField', () => {
	it('is a collection of header metadata options to streamline tar header parsing', () => {
		expect(fileName.type).toBe(TarHeaderFieldType.ASCII_PADDED_END);
	});

	describe('isUstarSector()', () => {
		it('returns true if the buffer contains a ustar indicator', () => {
			const testHeaderBuffer = TarHeader.serialize(null as any);
			expect(isUstarSector(testHeaderBuffer)).toBe(true);
		});

		it('returns false if the buffer does NOT contain a ustar indicator', () => {
			expect(isUstarSector(null as any)).toBe(false);
			expect(isUstarSector(new Uint8Array(0))).toBe(false);
		});

		it('allows for non-standard padding after ustar indicator header data', () => {
			const targetOffset = ustarIndicator.offset;
			const testHeaderBuffer = TarHeader.serialize(null as any);
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
			expect(() => lastModified.serialize(null as any)).not.toThrowError();
		});
	});

	describe('deserialize()', () => {
		const defaultHeader = TarHeader.seeded();
		const fields = TarHeaderField.all();

		for (const field of fields) {

			const headerValue = defaultHeader[field.name];
			const serialized = field.serialize(headerValue);
			const deserialized = field.deserialize(serialized);

			it(`mirrors the serialized value for "${field.name}"`, () => {
				expect(headerValue).toBeDefined();
				expect(serialized).toEqual(field.slice(defaultHeader.bytes));
			});

			it(`mirrors the deserialized value for "${field.name}"`, () => {
				expect(deserialized).toEqual(defaultHeader[field.name]);
			});
		}

		it('returns undefined when given malformed input', () => {
			let value: any = null;
			expect(() => value = lastModified.deserialize(null as any)).not.toThrowError();
			expect(value).not.toBeDefined();
		});
	});

	describe('writeTo()', () => {
		it('properly handles custom offsets', () => {
			const buffer = new Uint8Array(Constants.HEADER_SIZE * 2);
			const headerOffset = 42;
			const valueOctal = '777';
			const value = parseInt(valueOctal, 8);
			const field = fileMode;
			const fieldValue = field.serialize(value);
			const injected = field.writeTo(buffer, headerOffset, value);

			expect(injected).toBe(true);
			expect(field.slice(buffer, headerOffset)).toEqual(fieldValue);
		});

		it('returns false if the content could not be injected into the output buffer', () => {
			const buffer = new Uint8Array(10);
			const headerOffset = 42;
			const valueOctal = '777';
			const value = parseInt(valueOctal, 8);
			const field = fileMode;
			const injected = field.writeTo(buffer, headerOffset, value);

			expect(injected).toBe(false);
		});
	});

	describe('calculateChecksum()', () => {
		it('returns 0 if the input buffer is not valid', () => {
			expect(fileMode.calculateChecksum(null as any)).toBe(0);
		});
	});
});
