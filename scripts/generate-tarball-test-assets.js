#! /usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const tar = require('tar');

const { writeTarSample } = require('./tar-asset-util');

async function crawlTarAssets(files) {
	const globby = await import('globby').then(m => m.globby);
	return Promise.all(files.map(f => globby(f)));
}

async function readFileFromStream(stream) {

	const chunks = [];

	for await (let chunk of stream) {
		chunks.push(chunk);
	}

	return Buffer.concat(chunks);
}

function getProjectDirectoryName() {
	const { basename, dirname, resolve } = path;
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

function createOutputContent(options) {

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

async function exportTestAsssets(tarballContent, files) {

	const outputPath = './tests/generated/tarball-test-assets.ts';
	const fileStructures = await crawlTarAssets(files);
	const tarballSampleBase64 = tarballContent.toString('base64');
	const totalFileCount = fileStructures.reduce((count, globPaths) => count + globPaths.length, 0);
	const output = createOutputContent({ totalFileCount, fileStructures, tarballSampleBase64 });

	writeTarSample(tarballContent);
	fs.writeFileSync(outputPath, output, 'utf8');

	console.log('generated output at ' + outputPath + ' for files: ', files);
}

async function main() {

	const files = [
		'./dev-assets/tarball-sample/tar-root'
	];

	const tarballReadable = tar.create({ gzip: false }, files);
	const tarballContent = await readFileFromStream(tarballReadable);

	await exportTestAsssets(tarballContent, files);
}

main().catch(console.error);
