#! /usr/bin/env node

const fs = require('fs-extra');

const { Tarball } = require('../dist');
const { readTarSample } = require('./tar-asset-util');

const sampleTarBuffer = readTarSample();
const tarball = new Tarball(sampleTarBuffer);
const entries = tarball.readAllEntries().map(e => e.toAttributes());
const fileContent = Buffer.from(Tarball.from(entries));

fs.mkdirpSync('./tmp');
fs.writeFileSync('./tmp/tarball-serialize-test.tar', fileContent);