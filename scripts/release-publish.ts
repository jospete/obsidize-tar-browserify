#!/usr/bin/env node

import { execSync } from 'child_process';
import { readJsonSync } from 'fs-extra';
import yargs from 'yargs';
const { version } = readJsonSync('../package.json');
const { smokeTest } = <any>yargs().parse();

function git(cmd: string): Buffer | number {
	const fullCmd = 'git ' + cmd;
	console.log('> ' + fullCmd);
	return smokeTest ? 0 : execSync(fullCmd, { stdio: 'inherit' });
};

async function main() {

	const versionTag = version;
	const releaseBranchName = 'release/' + versionTag;
	const gitStatusOutput = execSync('git status').toString();
	const currentBranchNameMatch = /On branch (\S+)/.exec(gitStatusOutput);

	if (!currentBranchNameMatch) {
		console.error('failed to match current branch from gitStatusOutput = ', gitStatusOutput);
		console.log('currentBranchNameMatch = ', currentBranchNameMatch);
		process.exit(1);
	}

	const currentBranchName = currentBranchNameMatch[1];

	git('stash');
	git('checkout -b ' + releaseBranchName);
	git('stash apply');
	git('add --all');
	git('commit -m ' + versionTag);
	git('tag ' + versionTag);
	git('push -u origin --tags ' + releaseBranchName);
	git('checkout ' + currentBranchName);
	git('merge ' + releaseBranchName);
	git('push origin ' + currentBranchName);
}

main().catch(console.error);
