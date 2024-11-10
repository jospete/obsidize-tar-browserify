#! /usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirpSync, readFileSync, rmSync, writeFileSync } from 'fs-extra';
import { gzip, ungzip } from 'pako';
import { Archive } from '../dist';

async function main() {
	const src = './dev-assets/pax-tgz-sample/packed/test.tar.gz';
	const destDirectory = './tmp/test/pax-unpack-repack';
	const destDeflated = `${destDirectory}/unpack-repack-sample.tar`;
	const dest = `${destDirectory}/unpack-repack-sample.tar.gz`;

	if (existsSync(destDirectory)) {
		console.log(`removing existing output directory -> ${destDirectory}`);
		rmSync(destDirectory, {recursive: true});
	}
	
	mkdirpSync(destDirectory);

	const gzippedFileBuffer = readFileSync(src);
	const ungzippedFileUint8 = ungzip(gzippedFileBuffer);
	const archive = await Archive.extract(ungzippedFileUint8);
	const reconstructedArchive = new Archive();

	for (const entry of archive.entries) {
		if (entry.isDirectory()) {
			reconstructedArchive.addDirectory(entry.fileName);
		} else if (entry.isFile()) {
			reconstructedArchive.addBinaryFile(entry.fileName, entry.content!);
		}
	}

	for (const entry of reconstructedArchive.entries) {
		console.log(`reconstructed > ${entry.fileName}`);
	}

	const reconstructedBuffer = reconstructedArchive.toUint8Array();
	const reconstructedGzip = gzip(reconstructedBuffer);

	writeFileSync(destDeflated, reconstructedBuffer);
	writeFileSync(dest, reconstructedGzip);

	const cmd = `tar -tvf ${dest}`;
	console.log(`> ${cmd}`);
	execSync(cmd, { stdio: 'inherit' });
}

main().catch(console.error);
