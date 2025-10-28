import { config } from 'dotenv';
import { closeSync, existsSync, openSync, readSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ungzip } from 'pako';
import { Archive, ArchiveEntry, AsyncUint8ArrayLike } from '../dist';
import { mkdirpSync } from './utility';

// Load environment variables
config();

const enum OperationMode {
	DEFAULT = 'default',
	FIND_FIRST_GNU_LONG_PATH = 'firstGnuLongPath',
	FIND_FIRST_GNU_LONG_LINK_PATH = 'firstGnuLongLinkPath',
}

const downloadFileUrl = 'https://nodejs.org/dist/v22.20.0/node-v22.20.0-linux-x64.tar.gz';
const workingDir = './tmp/node-download-test';
const tarGzFilePath = join(workingDir, 'node.tar.gz');
const tarFilePath = join(workingDir, 'node.tar');

async function main() {
	const mode = process.env.TEST_UNPACK_NODE_MODE;
	console.log(`loaded mode = ${mode}`);

	if (!existsSync(tarFilePath)) {
		mkdirpSync(workingDir);
		const response = await fetch(downloadFileUrl);
		const tarballDataGz = await response.arrayBuffer();
		writeFileSync(tarGzFilePath, new Uint8Array(tarballDataGz));
		writeFileSync(tarFilePath, ungzip(tarballDataGz));
	}

	const tarFd = openSync(tarFilePath, 'r');
	const readBuffer = new Uint8Array(12 * 1000 * 1000);

	const asyncBuffer: AsyncUint8ArrayLike = {
		byteLength: statSync(tarFilePath).size,
		read: async (offset: number, length: number): Promise<Uint8Array> => {
			const bytesRead = readSync(tarFd, readBuffer, 0, length, offset);
			console.log(`async-buffer-read [${offset} - ${offset + length}) :: ${length} bytes requested, ${bytesRead} bytes read`);
			return readBuffer.slice(0, bytesRead);
		}
	};

	try {
		switch (mode) {
			case OperationMode.FIND_FIRST_GNU_LONG_PATH:
				await findFirstLongPathEntry(asyncBuffer);
				break;
			case OperationMode.FIND_FIRST_GNU_LONG_LINK_PATH:
				await findFirstLongLinkPathEntry(asyncBuffer);
				break;
			default:
				await listAllEntries(asyncBuffer);
				break;
		}
	} catch (e) {
		console.error(`mode ${mode} failed`, e);
	}

	closeSync(tarFd);
}

function getEntryType(entry: ArchiveEntry): string {
	if (entry.header.pax) return 'PAX';
	if (entry.header.gnu) return 'GNU';
	return 'USTAR';
}

function logEntry(entry: ArchiveEntry, entryCount: number) {
	const entryType = getEntryType(entry).padEnd(6, ' ');
	const prefix = `entry ${entryCount} ${entryType} (${entry.fileSize} bytes)`.padEnd(32, ' ');
	console.log(`${prefix} ${entry.fileName}`);
}

async function listAllEntries(asyncBuffer: AsyncUint8ArrayLike) {
	let entryCount = 0;

	for await (const entry of Archive.read(asyncBuffer)) {
		entryCount += 1;
		logEntry(entry, entryCount);
	}
}

async function findFirstLongPathEntry(asyncBuffer: AsyncUint8ArrayLike) {
	return await findFirstEntry('long-path', asyncBuffer, (entry) => entry.header.isGnuLongPathHeader);
}

async function findFirstLongLinkPathEntry(asyncBuffer: AsyncUint8ArrayLike) {
	return await findFirstEntry('long-link-path', asyncBuffer, (entry) => entry.header.isGnuLongLinkPathHeader);
}

async function findFirstEntry(tag: string, asyncBuffer: AsyncUint8ArrayLike, predicate: (entry: ArchiveEntry) => boolean) {
	let entryCount = 0;

	for await (const entry of Archive.read(asyncBuffer)) {
		entryCount += 1;
		logEntry(entry, entryCount);

		if (predicate(entry)) {
			console.log(`found ${tag} header at entry ${entryCount}!`);
			writeFileSync(join(workingDir, `${tag}-header-${entryCount}.json`), JSON.stringify(entry, null, '\t'));
			break;
		}
	}
}

main();