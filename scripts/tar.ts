#! /usr/bin/env node

import { create } from 'tar';

// Example Usage:
// npx tsx ./scripts/tar.ts ./dev-assets/tarball-sample/unpacked ./dev-assets/tarball-sample/packed/node-tar-sample.tar

async function main() {
	const [src, dest] = process.argv.slice(2);
	create({ gzip: false, file: dest}, [src]);
}

main().catch(console.error);
