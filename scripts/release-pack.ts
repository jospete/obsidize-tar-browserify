#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readJsonSync, renameSync, rmSync } from 'fs-extra';
import { resolve } from 'path';

const {version} = readJsonSync('../package.json');

async function run(distDirectory: string, outputDirectory: string): Promise<void> {

	if (existsSync(outputDirectory)) {
		// kill any previously packed files so we only ever have one
		rmSync(outputDirectory, {recursive: true});
	}

	mkdirSync(outputDirectory);

	// need the replacer here to get rid of newlines at the end of the command output
    const packFile = execSync(`npm pack ${distDirectory} --pack-destination=${outputDirectory}`).toString().replace(/\s/g, '');
    console.log(`pack file = ${packFile}`);

	const packFilePath = resolve(outputDirectory, packFile);
    const renameTarget = packFilePath.replace(`-${version}`, '');

	console.log(`rename ${packFilePath} -> ${renameTarget}`);
	renameSync(packFilePath, renameTarget);
};

run('./dist', './packed').catch(console.error);
