#! /usr/bin/env node

import { mkdirpSync } from 'fs-extra';
import { extract } from 'tar';

// Example Usage:
// > cd ./dev-assets/pax-tgz-sample/packed
// > npx tsx ../../../scripts/untar.ts ./test.tar ../unpacked

async function main() {
	const [src, dest] = process.argv.slice(2);
	mkdirpSync(dest);
	await extract({ file: src, cwd: dest });
}

main().catch(console.error);
