#! /usr/bin/env node

import tar from 'tar';

async function main() {
	const [src, dest] = process.argv.slice(2);
	await tar.extract({file: src, cwd: dest});
}

main().catch(console.error);
