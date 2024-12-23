#! /usr/bin/env node

import { mkdirpSync, readFileSync, writeFileSync } from 'fs-extra';
import { Archive } from '../dist';

async function main() {
	const tarFilePath = process.argv[2] || './dev-assets/tarball-sample/packed/node-tar-sample.tar';
	const sampleTarBuffer = readFileSync(tarFilePath);
	const entries = await Archive.extract(sampleTarBuffer);
	const outputObj = {
		sourceFile: tarFilePath,
		byteLength: sampleTarBuffer.byteLength,
		entryCount: entries.length,
		entries
	};

	mkdirpSync('./tmp');
	writeFileSync('./tmp/tarball-metadata.json', JSON.stringify(outputObj, null, '\t'), 'utf-8');
}

main().catch(console.error);
