#!/usr/bin/env node

import { cpSync, readFileSync, writeFileSync } from 'node:fs';

function main() {
	const assets = [
		{ from: './README.md', to: './dist/README.md' },
	];

	for (const { from, to } of assets) {
		console.log(`copy asset ${from} -> ${to}`);
		cpSync(from, to);
	}

	// Generate package.json for publishing by inheriting from root and removing build-only fields
	console.log('generate ./dist/package.json for publishing');
	const rootPackage = JSON.parse(readFileSync('./package.json', 'utf-8'));

	const publishPackage = {
		name: rootPackage.name,
		version: rootPackage.version,
		description: rootPackage.description,
		type: rootPackage.type,
		main: './index.cjs',
		module: './index.js',
		types: './index.d.ts',
		exports: {
			'.': {
				import: './index.js',
				require: './index.cjs',
				types: './index.d.ts',
			},
		},
		repository: rootPackage.repository,
		keywords: rootPackage.keywords,
		author: rootPackage.author,
		license: rootPackage.license,
		bugs: rootPackage.bugs,
		homepage: rootPackage.homepage,
		// Optionally include peerDependencies, dependencies if needed
	};

	writeFileSync('./dist/package.json', JSON.stringify(publishPackage, null, '\t'));
}

main();
