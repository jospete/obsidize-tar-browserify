#! /usr/bin/env node

const fs = require('fs-extra');

const sampleTarPath = './dev-assets/tarball-sample/output/node-tar-sample.tar';

function readTarSample() {
	return fs.readFileSync(sampleTarPath);
}

module.exports.readTarSample = readTarSample;

function writeTarSample(data) {
	console.log('updating tar sample at ' + sampleTarPath);
	fs.writeFileSync(sampleTarPath, data);
}

module.exports.writeTarSample = writeTarSample;
