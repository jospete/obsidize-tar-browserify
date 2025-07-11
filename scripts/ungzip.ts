#! /usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { inflate } from 'pako';

async function main() {
	const [src, dest] = process.argv.slice(2);
	const inputBytes = readFileSync(src);
	const outputBytes = inflate(inputBytes);
	writeFileSync(dest, outputBytes);
}

main().catch(console.error);
