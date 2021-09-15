#!/usr/bin/env node

const { argv } = require('yargs');
const { execSync } = require('child_process');
const { version } = require('../package.json');
const { smokeTest } = argv;

const git = (cmd) => {
	const fullCmd = 'git ' + cmd;
	console.log('> ' + fullCmd);
	return smokeTest ? 0 : execSync(fullCmd, { stdio: 'inherit' });
};

const versionTag = 'v' + version;
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