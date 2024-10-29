#! /usr/bin/env node

const pako = require('pako');
const fs = require('fs-extra');

async function main() {
	const [src, dest] = process.argv.slice(2);
	const inputBytes = fs.readFileSync(src);
	const outputBytes = pako.inflate(inputBytes);
	fs.writeFileSync(dest, outputBytes);
}

main().catch(console.error);
