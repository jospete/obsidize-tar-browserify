const fs = require('fs-extra');

const { Tarball } = require('../dist');
const { tarballSampleBase64 } = require('../tests/generated/tarball-test-assets');
const { base64ToUint8Array } = require('../tests/util');

const tarball = new Tarball(Buffer.from(tarballSampleBase64, 'base64'));

fs.mkdirpSync('./tmp');
fs.writeFileSync('./tmp/tarball-metadata.txt', JSON.stringify(tarball, null, '\t'), 'utf-8');