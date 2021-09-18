#! /usr/bin/env node

const fs = require('fs-extra');

const { Tarball } = require('../dist');
const { tarballSampleBase64 } = require('../tests/generated/tarball-test-assets');

const tarball = new Tarball(Buffer.from(tarballSampleBase64, 'base64'));
const entries = tarball.readAllEntries();

fs.mkdirpSync('./tmp');
fs.writeFileSync('./tmp/tarball-metadata.txt', JSON.stringify(entries, null, '\t'), 'utf-8');