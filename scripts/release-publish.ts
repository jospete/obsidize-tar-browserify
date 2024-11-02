#!/usr/bin/env node

import { execSync } from 'child_process';
import { readJsonSync } from 'fs-extra';
import yargs from 'yargs';

const { version } = readJsonSync('./package.json');
const { smokeTest } = <any>yargs().parse();

function git(cmd: string): Buffer | number {
	const fullCmd = 'git ' + cmd;
	console.log('> ' + fullCmd);
	return smokeTest ? 0 : execSync(fullCmd, { stdio: 'inherit' });
};

async function main() {
	const versionTag = version;
	const gitStatusOutput = execSync('git status').toString();
	const currentBranchNameMatch = /On branch (\S+)/.exec(gitStatusOutput);
	const currentBranchName = currentBranchNameMatch && currentBranchNameMatch[1];

	if (!currentBranchName) {
		console.error('failed to match current branch from gitStatusOutput = ', gitStatusOutput);
		console.log('currentBranchNameMatch = ', currentBranchNameMatch);
		process.exit(1);
	}

	git('add --all');
	git(`commit -m v${versionTag}`);
	git(`tag ${versionTag}`);
	git(`push -u origin --tags ${currentBranchName}`);
}

main().catch(console.error);
