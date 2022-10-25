import { TarHeaderFieldDefinition, TarHeaderLinkIndicatorType, TarHeaderUtility, TarUtility } from '../../src';
import { MockAsyncUint8Array } from '../mocks/mock-async-uint8array';
import { range } from '../util';

const staticDateTime = 1632419077000;
const staticDateTimeEncoded = 1632419077;

describe('TarHeaderUtility', () => {

	it('consistently encodes and decodes the same header buffer', () => {

		const header1 = TarHeaderUtility.sanitizeHeader({
			fileName: 'Test File.txt',
			fileSize: 50000,
			fileMode: 450
		});

		const headerBuffer1 = TarHeaderUtility.generateHeaderBuffer(header1);
		expect(TarUtility.isUint8Array(headerBuffer1)).toBe(true);
		expect(headerBuffer1.byteLength).toBe(TarHeaderUtility.HEADER_SIZE);

		const header2 = TarHeaderUtility.extractHeader(headerBuffer1);
		const headerBuffer2 = TarHeaderUtility.generateHeaderBuffer(header2);
		expect(headerBuffer2).toEqual(headerBuffer1);

		// We should be able to serialize and deserialize the same header multiple times without any data loss.
		const header3 = TarHeaderUtility.extractHeader(headerBuffer2);
		expect(header3.fileName).toBe(header1.fileName);
		expect(header3.fileSize).toBe(header1.fileSize);
		expect(header3.fileMode).toBe(header1.fileMode);
	});

	describe('decodeLastModifiedTime()', () => {

		it('converts the encoded value to a valid date time', () => {
			expect(TarHeaderUtility.decodeTimestamp(staticDateTimeEncoded)).toBe(staticDateTime);
		});

		it('floors floating point values', () => {
			expect(TarHeaderUtility.decodeTimestamp(staticDateTimeEncoded + 0.9)).toBe(staticDateTime);
		});
	});

	describe('encodeLastModifiedTime()', () => {

		it('encodes the value to a serializable mtime', () => {
			expect(TarHeaderUtility.encodeTimestamp(staticDateTime)).toBe(staticDateTimeEncoded);
		});

		it('floors floating point values', () => {
			expect(TarHeaderUtility.encodeTimestamp(staticDateTime + 0.9)).toBe(staticDateTimeEncoded);
		});
	});

	describe('sliceFieldBuffer()', () => {

		it('defaults to offset zero when no offset is provided', () => {
			const buffer = Uint8Array.from(range(0x1FF));
			const headerField = TarHeaderFieldDefinition.fileSize;
			const slicedBuffer = TarHeaderUtility.sliceFieldBuffer(headerField, buffer);
			const sliceStart = headerField.offset;
			const sliceEnd = sliceStart + headerField.size;
			expect(slicedBuffer).toEqual(buffer.slice(sliceStart, sliceEnd));
		});
	});

	describe('isUstarSector()', () => {

		it('returns true if the buffer contains a ustar indicator', () => {
			const testHeaderBuffer = TarHeaderUtility.generateHeaderBuffer(null);
			expect(TarHeaderUtility.isUstarSector(testHeaderBuffer)).toBe(true);
		});

		it('returns false if the buffer does NOT contain a ustar indicator', () => {
			expect(TarHeaderUtility.isUstarSector(null as any)).toBe(false);
			expect(TarHeaderUtility.isUstarSector(new Uint8Array(0))).toBe(false);
		});
	});

	describe('sanitizeHeader()', () => {

		it('populates missing fields with sensible defaults', () => {
			const header = TarHeaderUtility.sanitizeHeader(null);
			expect(header).not.toBeFalsy();
			expect(header.fileMode).toBe(TarHeaderUtility.FILE_MODE_DEFAULT);
			expect(header.typeFlag).toBe(TarHeaderLinkIndicatorType.NORMAL_FILE);
		});
	});

	describe('findNextUstarSectorOffset()', () => {

		it('returns the offset of the next header sector', () => {
			const testHeaderBuffer = TarHeaderUtility.generateHeaderBuffer(null);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer)).toBe(0);
		});

		it('returns -1 when there is no ustar sector in the given scope', () => {
			expect(TarHeaderUtility.findNextUstarSectorOffset(null as any)).toBe(-1);
		});

		it('uses the given offset when it is provided', () => {

			const padLength = TarUtility.SECTOR_SIZE * 2;
			const paddingBuffer = new Uint8Array(padLength);
			const testHeaderBuffer = TarHeaderUtility.generateHeaderBuffer(null);
			const combinedBuffer = TarUtility.concatUint8Arrays(paddingBuffer, testHeaderBuffer);

			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer)).toBe(padLength);
			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer, padLength)).toBe(padLength);
			expect(TarHeaderUtility.findNextUstarSectorOffset(combinedBuffer, combinedBuffer.byteLength - 10)).toBe(-1);
		});

		it('snaps negative offsets to zero', () => {
			const testHeaderBuffer = TarHeaderUtility.generateHeaderBuffer(null);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer, -1)).toBe(0);
			expect(TarHeaderUtility.findNextUstarSectorOffset(testHeaderBuffer, -123456)).toBe(0);
		});
	});

	describe('parseIntOctal()', () => {

		it('translates the given octal string into a number', () => {
			expect(TarHeaderUtility.parseIntOctal('777')).toBe(parseInt('777', 8));
		});

		it('removes trailing zeroes and white space', () => {
			expect(TarHeaderUtility.parseIntOctal('0000777 \0\0\0\0')).toBe(parseInt('777', 8));
		});

		it('returns a default value when the given input cannot be parsed to a number', () => {
			expect(TarHeaderUtility.parseIntOctal(null as any)).toBe(0);
		});
	});

	describe('serializeFieldValue()', () => {

		it('interprets the given value based on the given field metadata', () => {
			const valueOctal = '777';
			const value = parseInt(valueOctal, 8);
			const field = TarHeaderFieldDefinition.fileMode;
			const fieldValue = TarHeaderUtility.serializeFieldValue(field, value);
			expect(TarHeaderUtility.deserializeFieldValue(field, fieldValue)).toBe(value);
		});

		it('decodes mtime values to proper Date timestamps', () => {
			const now = TarHeaderUtility.decodeTimestamp(TarHeaderUtility.encodeTimestamp(Date.now()));
			const field = TarHeaderFieldDefinition.lastModified;
			const fieldValue = TarHeaderUtility.serializeFieldValue(field, now);
			expect(TarHeaderUtility.deserializeFieldValue(field, fieldValue)).toBe(now);
		});
	});

	describe('serializeFieldValue()', () => {

		it('returns an empty Uint8Array on malformed input', () => {
			expect(TarHeaderUtility.serializeFieldValue(null as any, 'test'))
				.toEqual(new Uint8Array(0));
		});
	});

	describe('deserializeFieldValue()', () => {

		const defaultHeader = TarHeaderUtility.expandHeaderToExtractionResult(null);

		for (const [propertyName, metadata] of Object.entries(defaultHeader)) {

			const serialized = TarHeaderUtility.serializeFieldValue(metadata.field, metadata.value);
			const deserialized = TarHeaderUtility.deserializeFieldValue(metadata.field, serialized);

			it('mirrors the serializer functions for "' + propertyName + '"', () => {
				expect(serialized).toEqual(metadata.bytes);
				expect(deserialized).toEqual(metadata.value);
			});
		}

		it('returns undefined for unknown field types', () => {
			expect(TarHeaderUtility.deserializeFieldValue(null as any, new Uint8Array(0))).not.toBeDefined();
		});
	});

	describe('serializeIntegerOctalWithSuffix()', () => {

		it('uses a default min length of zero when a field is not given', () => {
			expect(TarHeaderUtility.serializeIntegerOctalWithSuffix(0, null as any, ''))
				.toEqual(TarUtility.encodeString('0'));
		});
	});

	describe('flattenHeaderExtractionResult()', () => {

		it('returns an unpopulated object when the input is malformed', () => {
			expect(TarHeaderUtility.flattenHeaderExtractionResult(null as any))
				.toEqual(TarHeaderUtility.getDefaultHeaderValues());
		});

		it('properly handles malformed objects', () => {
			expect(TarHeaderUtility.flattenHeaderExtractionResult({ fileName: null } as any))
				.toEqual(TarHeaderUtility.getDefaultHeaderValues());
		});
	});

	describe('findNextUstarSectorAsync()', () => {

		it('returns null when malformed inputs are given', async () => {
			expect(await TarHeaderUtility.findNextUstarSectorAsync(null as any)).toBe(null);
			const mockBuffer = new Uint8Array(5);
			const mockAsyncBuffer = new MockAsyncUint8Array(mockBuffer);
			expect(await TarHeaderUtility.findNextUstarSectorAsync(mockAsyncBuffer, mockBuffer.byteLength)).toBe(null);
		});
	});
});