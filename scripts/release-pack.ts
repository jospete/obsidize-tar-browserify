#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const { version } = JSON.parse(readFileSync('./package.json').toString());

function main(distDirectory: string, outputDirectory: string) {
	// need the replacer here to get rid of newlines at the end of the command output
	const packFile = execSync(`npm pack ${distDirectory} --pack-destination=${outputDirectory}`)
		.toString()
		.replace(/\s/g, '');
	console.log(`pack file = ${packFile}`);

	const packFilePath = resolve(outputDirectory, packFile);
	const renameTarget = packFilePath.replace(`-${version}`, '');

	if (existsSync(renameTarget)) {
		rmSync(renameTarget);
	}

	console.log(`rename ${packFilePath} -> ${renameTarget}`);
	renameSync(packFilePath, renameTarget);
}

main('./dist', './packed');
