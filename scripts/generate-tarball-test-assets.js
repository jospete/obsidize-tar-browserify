#! /usr/bin/env node

const fs = require('fs-extra');
const tar = require('tar');

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

async function exportTestAsssets(tarballContent, files) {

	const outputPath = './tests/generated/tarball-test-assets.ts';
	const fileStructures = await crawlTarAssets(files);
	const tarballSampleBase64 = tarballContent.toString('base64');
	const totalFileCount = fileStructures.reduce((count, globPaths) => count + globPaths.length, 0);

	const output = `
export const totalFileCount = ${totalFileCount};

export const fileStructures = ${JSON.stringify(fileStructures, null, '\t')};

export const tarballSampleBase64 = '${tarballSampleBase64}';
`;

	fs.writeFileSync(outputPath, output, 'utf8');
	console.log('generated output at ' + outputPath + ' for files: ', files);
}

async function run() {

	const files = [
		'./dev-assets/tarball-sample/tar-root'
	];

	const tarballReadable = await tar.create({ gzip: false }, files);
	const tarballContent = await readFileFromStream(tarballReadable);

	await exportTestAsssets(tarballContent, files);
}

run();