#! /usr/bin/env node

const fs = require('fs-extra');

const { Tarball } = require('../dist');
const { readTarSample } = require('./tar-asset-util');

async function main() {

	const sampleTarBuffer = readTarSample();
	const tarball = new Tarball(sampleTarBuffer);
	const entries = tarball.readAllEntries();

	fs.mkdirpSync('./tmp');
	fs.writeFileSync('./tmp/tarball-metadata.txt', JSON.stringify(entries, null, '\t'), 'utf-8');
}

main().catch(console.error);