#!/usr/bin/env node

import { cpSync } from 'node:fs';

function main() {
	const assets = [
		{ from: './README.md', to: './dist/README.md' },
		{ from: './package.json', to: './dist/package.json' },
		{ from: './packed/obsidize-tar-browserify.cjs', to: './dist/index.cjs' },
	];

	for (const { from, to } of assets) {
		console.log(`copy asset ${from} -> ${to}`);
		cpSync(from, to);
	}
}

main();
