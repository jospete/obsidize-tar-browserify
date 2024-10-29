#! /usr/bin/env node

import { mkdirpSync, readFileSync, writeFileSync } from 'fs-extra';
import { Tarball, TarEntry } from '../dist';

async function main() {
	const tarFilePath = process.argv[2] || './dev-assets/tarball-sample/packed/node-tar-sample.tar';
	const sampleTarBuffer = readFileSync(tarFilePath);
	const tarball = new Tarball(sampleTarBuffer);
	const fileContent = Buffer.from(TarEntry.serialize(tarball.entries));

	mkdirpSync('./tmp');
	writeFileSync('./tmp/tarball-serialize-test.tar', fileContent);
}

main().catch(console.error);
