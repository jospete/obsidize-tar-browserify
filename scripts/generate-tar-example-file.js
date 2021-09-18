#! /usr/bin/env node

const fs = require('fs-extra');

const { Tarball } = require('../dist');
const { tarballSampleBase64 } = require('../tests/generated/tarball-test-assets');

const tarball = new Tarball(Buffer.from(tarballSampleBase64, 'base64'));
const entries = tarball.readAllEntries();

fs.mkdirpSync('./tmp');
fs.writeFileSync('./tmp/tarball-serialize-test.tar', Buffer.from(Tarball.from(entries)));