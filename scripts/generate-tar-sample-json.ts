#! /usr/bin/env node

import { mkdirpSync, readFileSync, writeFileSync } from 'fs-extra';
import { Tarball } from '../dist';

async function main() {
	const tarFilePath = process.argv[2] || './dev-assets/tarball-sample/packed/node-tar-sample.tar';
	const sampleTarBuffer = readFileSync(tarFilePath);
	const tarball = new Tarball(sampleTarBuffer);
	const {entries} = tarball;

	mkdirpSync('./tmp');
	writeFileSync('./tmp/tarball-metadata.txt', JSON.stringify(entries, null, '\t'), 'utf-8');
}

main().catch(console.error);
