#! /usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { Archive } from '../dist';
import { mkdirpSync } from './utility';

async function main() {
	const tarFilePath = process.argv[2] || './dev-assets/tarball-sample/packed/node-tar-sample.tar';
	const sampleTarBuffer = readFileSync(tarFilePath);
	const {entries} = await Archive.extract(sampleTarBuffer);
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
