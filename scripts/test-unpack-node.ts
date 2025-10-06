import { closeSync, existsSync, openSync, readSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ungzip } from 'pako';
import { Archive, ArchiveEntry, AsyncUint8ArrayLike } from '../dist';
import { mkdirpSync } from './utility';

const enum OperationMode {
	DEFAULT = 'default',
	FIND_FIRST_LONG_LINK = 'firstLongLink'
}

const downloadFileUrl = 'https://nodejs.org/dist/v22.20.0/node-v22.20.0-linux-x64.tar.gz';
const workingDir = './tmp/node-download-test';
const tarGzFilePath = join(workingDir, 'node.tar.gz');
const tarFilePath = join(workingDir, 'node.tar');

async function main() {
	const [ mode ] = process.argv.slice(2);

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
			const bytesRead = readSync(tarFd, readBuffer, 0, length , offset);
			return readBuffer.slice(0, bytesRead);
		}
	};

	try {
		switch (mode) {
		case OperationMode.FIND_FIRST_LONG_LINK:
			await findFirstLongLinkEntry(asyncBuffer);
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

async function listAllEntries(asyncBuffer: AsyncUint8ArrayLike) {
	let entryCount = 0;

	for await (const entry of Archive.read(asyncBuffer)) {
		entryCount += 1;
		console.log(`entry ${entryCount} (${entry.fileSize} bytes) ${entry.fileName}`);
	}
}

async function findFirstLongLinkEntry(asyncBuffer: AsyncUint8ArrayLike) {
	let entryCount = 0;
	let previousEntry: ArchiveEntry | null = null;

	for await (const entry of Archive.read(asyncBuffer)) {
		entryCount += 1;
		console.log(`got entry ${entryCount} ${entry.fileName} ${entry.fileSize} bytes`);

		if (previousEntry?.fileName !== '././@LongLink') {
			previousEntry = entry;
			continue;
		}

		writeFileSync(join(workingDir, `longlink-${entryCount}-prev.json`), JSON.stringify(previousEntry, null, '\t'));
		writeFileSync(join(workingDir, `longlink-${entryCount}-curr.json`), JSON.stringify(entry, null, '\t'));
		break;
	}
}

main();