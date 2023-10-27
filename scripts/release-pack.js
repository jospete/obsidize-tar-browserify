#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const { version } = require('../package.json');

const run = async (distDirectory, outputDirectory) => {

	if (fs.existsSync(outputDirectory)) {
		// kill any previously packed files so we only ever have one
		fs.rmSync(outputDirectory, {recursive: true});
	}

	fs.mkdirSync(outputDirectory);

	// need the replacer here to get rid of newlines at the end of the command output
    const packFile = execSync(`npm pack ${distDirectory} --pack-destination=${outputDirectory}`).toString().replace(/\s/g, '');
    console.log(`pack file = ${packFile}`);

	const packFilePath = path.resolve(outputDirectory, packFile);
    const renameTarget = packFilePath.replace(`-${version}`, '');

	console.log(`rename ${packFilePath} -> ${renameTarget}`);
	fs.renameSync(packFilePath, renameTarget);
};

run('./dist', './packed');