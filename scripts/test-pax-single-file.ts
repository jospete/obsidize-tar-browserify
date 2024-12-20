#! /usr/bin/env node

import { execSync } from 'child_process';
import { mkdirpSync, writeFileSync } from 'fs-extra';
import { Archive } from '../dist';

async function main() {
	const outputDir = './tmp/test/pax-single-file';
	const outputFilePath = outputDir + '/pax-tar-cli-test.tar';
	const jsonDebugOutput = outputDir + '/pax-tar-cli-test-archive-state.json';

	const archive = new Archive().addTextFile(
		'this_is_a_single_text_file_with_a_really_long_name_to_test_if_this_module_can_generate_valid_pax_headers_for_the_standard_tar_cli.txt',
		'Test file content'
	);
	
	mkdirpSync(outputDir);

	const bytes = archive.toUint8Array();
	writeFileSync(outputFilePath, bytes);
	writeFileSync(jsonDebugOutput, JSON.stringify(archive, null, '\t'), 'utf8');

	const cmd = `tar -tvf ${outputFilePath}`;
	console.log(`> ${cmd}`);
	
	try {
		execSync(cmd, { stdio: 'inherit' });
	} catch (e) {
		console.error(`tar command failed: ${e}`);
	}
}

main().catch(console.error);
