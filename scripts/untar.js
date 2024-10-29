#! /usr/bin/env node

const fs = require('fs-extra');
const tar = require('tar');

async function main() {
	const [src, dest] = process.argv.slice(2);
	await tar.extract({file: src, cwd: dest});
}

main().catch(console.error);
