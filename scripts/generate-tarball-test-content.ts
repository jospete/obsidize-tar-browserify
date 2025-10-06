#! /usr/bin/env node

import { globby } from 'globby';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'path';
import { extract } from 'tar';
import { mkdirpSync } from './utility';

async function crawlTarAssets(cwd: string, files: string[]): Promise<string[][]> {
	return Promise.all(files.map(f => globby(f, {cwd, dot: true})));
}

function getProjectDirectoryName() {
	return basename(dirname(resolve(__filename, '..')));
}

function getScriptPathRelativeToProject() {
	console.log(`getScriptPathRelativeToProject()`);

	const absScriptPath = __filename;
	console.log(`       path = "${absScriptPath}"`);

	const projectDirName = getProjectDirectoryName();
	console.log(`    project = "${projectDirName}"`);
	const result = __filename.substring(__filename.indexOf(projectDirName));
	console.log(`     result = "${result}"`);

	return result;
}

interface TarballTestAssetOptions {
	totalFileCount: number;
	fileStructures: string[][];
	tarballSampleBase64: string;
}

function createOutputContent(options: TarballTestAssetOptions) {

	const { totalFileCount, fileStructures, tarballSampleBase64 } = options;
	const fileStructuresContent = JSON.stringify(fileStructures, null, '\t');
	const scriptPath = getScriptPathRelativeToProject();

	return `// AUTO-GENERATED VIA ${scriptPath}
// DO NOT EDIT

export const totalFileCount = ${totalFileCount};

export const fileStructures = ${fileStructuresContent};

export const tarballSampleBase64 = '${tarballSampleBase64}';
`;
}

async function exportTestAssets(tarballContent: Buffer, files: string[], outputFileName: string, pathPrefix: string) {
	const outputPath = `./src/test/generated/${outputFileName}`;
	const fileStructures = await crawlTarAssets(pathPrefix, files);
	console.log(`exportTestAssets -> fileStructures = `, fileStructures);
	const tarballSampleBase64 = tarballContent.toString('base64');
	const totalFileCount = fileStructures.reduce((count, globPaths) => count + globPaths.length, 0);
	const output = createOutputContent({ totalFileCount, fileStructures, tarballSampleBase64 });
	writeFileSync(outputPath, output, 'utf8');
	console.log('generated output at ' + outputPath + ' for files: ', files);
}

async function generateTarSampleOne() {
	const tarFilePath = './dev-assets/tarball-sample/packed/node-tar-sample.tar';
	const unpackedPath = './dev-assets/tarball-sample/unpacked';
	const tarballContent = readFileSync(tarFilePath);
	await exportTestAssets(tarballContent, ['**/*'], 'tarball-test-content.ts', unpackedPath);
}

async function generateTarSampleTwo() {
	const tarFilePath = './dev-assets/pax-tgz-sample/packed/test.tar';
	const unpackedPath = './dev-assets/pax-tgz-sample/unpacked';
	const tarballContent = readFileSync(tarFilePath);
	mkdirpSync(unpackedPath);
	await extract({file: tarFilePath, cwd: unpackedPath});
	await exportTestAssets(tarballContent, ['**/*'], 'pax-header-test-content.ts', unpackedPath);
}

async function generateTarSampleThree() {
	const tarFilePath = './dev-assets/long-link-sample/packed/long-link-sample.tar';
	const unpackedPath = './dev-assets/long-link-sample/unpacked';
	const tarballContent = readFileSync(tarFilePath);
	await exportTestAssets(tarballContent, ['**/*'], 'long-link-header-test-content.ts', unpackedPath);
}

async function main() {
	await generateTarSampleOne();
	await generateTarSampleTwo();
	await generateTarSampleThree();
}

main().catch(console.error);
