#! /usr/bin/env node

import { extract } from 'tar';

// Example Usage:
// npx tsx ./scripts/untar.ts ./dev-assets/pax-tgz-sample/packed/test.tar ./dev-assets/pax-tgz-sample/unpacked/

async function main() {
	const [src, dest] = process.argv.slice(2);
	await extract({ file: src, cwd: dest });
}

main().catch(console.error);
