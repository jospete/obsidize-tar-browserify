#! /usr/bin/env node

import { create } from 'tar';

// Example Usage:
// > cd ./dev-assets/tarball-sample/unpacked
// > npx tsx ../../../scripts/tar.ts . ../packed/node-tar-sample.tar

async function main() {
	const [src, dest] = process.argv.slice(2);
	create({ gzip: false, file: dest}, [src]);
}

main().catch(console.error);
