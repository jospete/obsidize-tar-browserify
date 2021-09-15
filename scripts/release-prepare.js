#! /usr/bin/env node

const { argv } = require('yargs');
const { execSync } = require('child_process');

const { releaseAs } = argv;
execSync('npm version --git-tag-version=false --allow-same-version=true ' + releaseAs, { stdio: 'inherit' });