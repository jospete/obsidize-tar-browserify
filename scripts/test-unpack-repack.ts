#! /usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { gzip, ungzip } from 'pako';
import { Archive } from '../dist';

async function main() {
	const args = process.argv.slice(2);
	const src = args[0] || './dev-assets/pax-tgz-sample/packed/test.tar.gz';
	const destDirectory = args[1] || './tmp/test/pax-unpack-repack';
	const destDeflated = `${destDirectory}/unpack-repack-sample.tar`;
	const dest = `${destDirectory}/unpack-repack-sample.tar.gz`;

	if (existsSync(destDirectory)) {
		console.log(`removing existing output directory -> ${destDirectory}`);
		rmSync(destDirectory, {recursive: true});
	}
	
	if (!existsSync(destDirectory)) mkdirSync(destDirectory);

	let tarBuffer: Uint8Array;

	if (src.endsWith('.gz')) {
		const gzippedFileBuffer = readFileSync(src);
		tarBuffer = ungzip(gzippedFileBuffer);
	} else {
		tarBuffer = readFileSync(src);
	}

	const archive = await Archive.extract(tarBuffer);
	archive.cleanAllHeaders();

	for (const entry of archive.entries) {
		console.log(`reconstructed > ${entry.fileName}`);
	}

	const reconstructedBuffer = archive.toUint8Array();
	const reconstructedGzip = gzip(reconstructedBuffer);

	writeFileSync(destDeflated, reconstructedBuffer);
	writeFileSync(dest, reconstructedGzip);

	const cmd = `tar -tvf ${dest}`;
	console.log(`> ${cmd}`);
	
	try {
		execSync(cmd, { stdio: 'inherit' });
	} catch (e) {
		console.error(`tar command failed: ${e}`);
	}

	const jsonDebugOutput = `${destDirectory}/archive-state.json`;
	writeFileSync(jsonDebugOutput, JSON.stringify(archive, null, '\t'), 'utf8');
}

main().catch(console.error);
