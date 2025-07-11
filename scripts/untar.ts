#! /usr/bin/env node

import { existsSync, mkdirSync } from 'node:fs';
import { extract } from 'tar';

// Example Usage:
// > cd ./dev-assets/pax-tgz-sample/packed
// > npx tsx ../../../scripts/untar.ts ./test.tar ../unpacked

async function main() {
	const [src, dest] = process.argv.slice(2);
	if (!existsSync(dest)) mkdirSync(dest);
	await extract({ file: src, cwd: dest });
}

main().catch(console.error);
