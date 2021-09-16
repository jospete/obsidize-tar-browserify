#! /usr/bin/env node

const fs = require('fs-extra');
const tar = require('tar');

function omitLeadingString(leadingString, input) {
	const index = input.indexOf(leadingString);
	const result = index < 0 ? input : input.substring(index + leadingString.length);
	console.log(`omitLeadingString() "${leadingString}" from "${input}" -> ${result}`);
	return result;
}

function appendTrailingString(trailingString, input) {
	const result = input.endsWith(trailingString) ? input : (input + trailingString);
	console.log(`appendTrailingString() "${trailingString}" to "${input}" -> ${result}`);
	return result;
}

function normalizePath(path) {
	const isDirectory = fs.lstatSync(path).isDirectory();
	const pathSuffix = isDirectory ? '/' : '';
	return appendTrailingString(pathSuffix, omitLeadingString('./', path));
}

async function crawlTarAssets(files) {

	const globby = await import('globby').then(m => m.globby);

	const getFileGlobAt = async (pathGlob) => {
		const targetPath = normalizePath(pathGlob);
		const paths = await globby(pathGlob);
		return paths.map(p => omitLeadingString(targetPath, p));
	};

	return Promise.all(files.map(f => getFileGlobAt(f)));
}

async function readFileFromStream(stream) {

	const chunks = [];

	for await (let chunk of stream) {
		chunks.push(chunk);
	}

	return Buffer.concat(chunks);
}

async function exportTestAsssets(tarballContent, files) {

	const fileStructures = await crawlTarAssets(files);
	const tarballSampleBase64 = tarballContent.toString('base64');
	const outputPath = './tests/generated/tarball-test-assets.ts';

	const output = `
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