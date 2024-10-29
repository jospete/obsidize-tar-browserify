#! /usr/bin/env node

const fs = require('fs-extra');

const { Tarball, TarEntry } = require('../dist');
const { readTarSample } = require('./tar-asset-util');

async function main() {

	const sampleTarBuffer = readTarSample();
	const tarball = new Tarball(sampleTarBuffer);
	const fileContent = Buffer.from(TarEntry.serialize(tarball.entries));

	fs.mkdirpSync('./tmp');
	fs.writeFileSync('./tmp/tarball-serialize-test.tar', fileContent);
}

main().catch(console.error);
