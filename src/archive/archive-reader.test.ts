import { ArchiveContext } from '../common/archive-context';
import { InMemoryAsyncUint8Array } from '../common/async-uint8-array';
import { AsyncUint8ArrayIterator } from '../common/async-uint8-array-iterator';
import { Constants } from '../common/constants';
import { TarUtility } from '../common/tar-utility';
import { PaxTarHeader, PaxTarHeaderAttributes } from '../header/pax/pax-tar-header';
import { PaxTarHeaderKey } from '../header/pax/pax-tar-header-key';
import { TarHeader } from '../header/tar-header';
import { UstarHeaderLike } from '../header/ustar/ustar-header-like';
import { UstarHeaderLinkIndicatorType } from '../header/ustar/ustar-header-link-indicator-type';
import { tarballSampleBase64 as PAX_tarballSampleBase64, totalFileCount as PAX_totalFileCount } from '../test/generated/pax-header-test-content';
import { base64ToUint8Array, range } from '../test/test-util';
import { ArchiveReader, ArchiveReadError } from './archive-reader';

// TODO: move this logic into `ArchiveWriter` as a formal implementation for adding PAX headers
const createPaxHeaderBuffer = (
	headerAttrs: Partial<UstarHeaderLike>,
	paxAttrs: Partial<PaxTarHeaderAttributes>,
	global?: boolean
): Uint8Array => {
	const typeFlag = global ? UstarHeaderLinkIndicatorType.GLOBAL_EXTENDED_HEADER : UstarHeaderLinkIndicatorType.LOCAL_EXTENDED_HEADER;
	const actualHeader = TarHeader.serialize(headerAttrs);
	const paxHeader = PaxTarHeader.serializeAttributes(paxAttrs);
	const preambleHeader = TarHeader.serialize({
		fileName: Constants.PAX_HEADER_PREFIX + '/' + headerAttrs.fileName,
		fileSize: paxHeader.byteLength,
		typeFlag
	});

	const paxHeaderSectorLength = TarUtility.roundUpSectorOffset(paxHeader.byteLength);
	const totalLength = preambleHeader.byteLength + paxHeaderSectorLength + actualHeader.byteLength;
	const result = new Uint8Array(totalLength);
	let offset = 0;

	result.set(preambleHeader, offset);
	offset += preambleHeader.byteLength;

	result.set(paxHeader, offset);
	offset += paxHeaderSectorLength;

	result.set(actualHeader, offset);

	return result;
};

describe('ArchiveReader', () => {
	it('should be creatable', () => {
		const iterator = new AsyncUint8ArrayIterator(new InMemoryAsyncUint8Array(new Uint8Array()));
		const reader = new ArchiveReader(iterator);
		expect(reader).toBeTruthy();
	});

	it('should implement ArchiveContext', () => {
		const bufferSource = new InMemoryAsyncUint8Array(new Uint8Array());
		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const context: ArchiveContext = new ArchiveReader(iterator);
		expect(context.source).toBe(bufferSource);
		expect(context.globalPaxHeaders).toEqual([]);
	});

	it('should correctly parse pax headers', async () => {
		const buffer = base64ToUint8Array(PAX_tarballSampleBase64);
		const entries = await ArchiveReader.readAllEntriesFromMemory(buffer);
		const files = entries.filter(v => v.isFile());
		expect(files.length).toBeGreaterThan(0);
		const paxEntry = entries.find(v => !!v?.header?.pax);
		expect(paxEntry).toBeTruthy();
	});

	it('should be able to parse from buffer sources with a small chunk size', async () => {
		const buffer = base64ToUint8Array(PAX_tarballSampleBase64);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource, {blockSize: Constants.SECTOR_SIZE});
		const reader = new ArchiveReader(iterator);
		const entries = await reader.readAllEntries();
		const files = entries.filter(v => v.isFile());
		expect(files.length).toBe(PAX_totalFileCount);
	});

	it('should bail safely when given a non-tar buffer', async () => {
		const buffer = Uint8Array.from([1, 2, 3, 4]);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);
		const entries = await reader.readAllEntries();
		expect(entries.length).toBe(0);
	});

	it('should blow up on entries that do not adhere to the tar format', async () => {
		const contentLength = Constants.SECTOR_SIZE + 1;
		const content = Uint8Array.from(range(contentLength));

		const header = TarHeader.from({
			fileName: 'truncated.bin',
			typeFlag: UstarHeaderLinkIndicatorType.NORMAL_FILE,
			fileSize: contentLength
		}).toUint8Array();

		const buffer = TarUtility.concatUint8Arrays(header, content);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);

		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);

		try {
			await reader.readAllEntries();
			fail('readAllEntries should not succeed for malformed input');
		} catch (e) {
			expect(e).toBe(ArchiveReadError.ERR_ENTRY_CONTENT_MIN_BUFFER_LENGTH_NOT_MET);
		}
	});

	it('should skip reading the content buffer for non-in-memory entries', async () => {
		const contentLength = Constants.SECTOR_SIZE;
		const content = Uint8Array.from(range(contentLength));

		const header = TarHeader.from({
			fileName: 'truncated.bin',
			typeFlag: UstarHeaderLinkIndicatorType.NORMAL_FILE,
			fileSize: contentLength
		}).toUint8Array();

		const buffer = TarUtility.concatUint8Arrays(header, content);
		const bufferSource = new InMemoryAsyncUint8Array(buffer);

		const iterator = new AsyncUint8ArrayIterator({
			byteLength: () => bufferSource.byteLength(),
			read: (offset, length) => bufferSource.read(offset, length)
		});

		const reader = new ArchiveReader(iterator);
		const entries = await reader.readAllEntries();

		expect(entries.length).toBe(1);
		expect(entries[0].content).toBe(null);
	});

	it('should append global pax headers to reader context interface array', async () => {
		const headerAttrs: Partial<UstarHeaderLike> = {
			fileName: 'Some Global Garbage',
			typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY
		};
		const paxAttrs: Partial<PaxTarHeaderAttributes> = {
			[PaxTarHeaderKey.PATH]: 'A an extra name override or something',
			[PaxTarHeaderKey.SIZE]: '0'
		};

		const paxBuffer = createPaxHeaderBuffer(headerAttrs, paxAttrs, true);
		const bufferSource = new InMemoryAsyncUint8Array(paxBuffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);
		const entries = await reader.readAllEntries();

		expect(entries.length).toBe(1);
		expect(reader.globalPaxHeaders.length).toBe(1);
	});

	it('should blow up on malformed global pax header entries', async () => {
		const headerAttrs: Partial<UstarHeaderLike> = {
			fileName: 'Some Global Garbage',
			typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY
		};
		const paxAttrs: Partial<PaxTarHeaderAttributes> = {
			fileName: 'A an extra name override or something'
		};

		const paxBuffer = createPaxHeaderBuffer(headerAttrs, paxAttrs, true);
		const corruptedBuffer = paxBuffer.slice(0, paxBuffer.byteLength - Constants.SECTOR_SIZE + 5);
		const bufferSource = new InMemoryAsyncUint8Array(corruptedBuffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);

		try {
			await reader.readAllEntries();
			fail('readAllEntries should not succeed for malformed input');
		} catch (e) {
			expect(e).toBe(ArchiveReadError.ERR_HEADER_PAX_MIN_BUFFER_LENGTH_NOT_MET);
		}
	});

	it('should blow up on malformed local pax header entries', async () => {
		const headerAttrs: Partial<UstarHeaderLike> = {
			fileName: 'Some Local Garbage',
			typeFlag: UstarHeaderLinkIndicatorType.DIRECTORY
		};
		const paxAttrs: Partial<PaxTarHeaderAttributes> = {
			fileName: 'A an extra name override or something'
		};
		
		const paxBuffer = createPaxHeaderBuffer(headerAttrs, paxAttrs);
		paxBuffer.set(range(Constants.HEADER_SIZE), paxBuffer.byteLength - Constants.HEADER_SIZE);

		const bufferSource = new InMemoryAsyncUint8Array(paxBuffer);
		const iterator = new AsyncUint8ArrayIterator(bufferSource);
		const reader = new ArchiveReader(iterator);

		try {
			await reader.readAllEntries();
			fail('readAllEntries should not succeed for malformed input');
		} catch (e) {
			expect(e).toBe(ArchiveReadError.ERR_HEADER_MISSING_POST_PAX_SEGMENT);
		}
	});
});
