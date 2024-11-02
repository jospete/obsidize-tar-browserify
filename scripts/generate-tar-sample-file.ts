#! /usr/bin/env node

import { mkdirpSync, readFileSync, writeFileSync } from 'fs-extra';
import { Archive } from '../dist';

async function main() {
	const tarFilePath = process.argv[2] || './dev-assets/tarball-sample/packed/node-tar-sample.tar';
	const sampleTarBuffer = readFileSync(tarFilePath);
	const archive = await Archive.extract(sampleTarBuffer);
	const fileContent = Buffer.from(archive.toUint8Array());

	mkdirpSync('./tmp');
	writeFileSync('./tmp/tarball-serialize-test.tar', fileContent);
}

main().catch(console.error);
