#! /usr/bin/env node

import { mkdirpSync, readFileSync, writeFileSync } from 'fs-extra';
import { globby } from 'globby';
import { basename, dirname, resolve } from 'path';
import { Stream } from 'stream';
import tar from 'tar';

async function crawlTarAssets(files: string[]): Promise<string[][]> {
	return Promise.all(files.map(f => globby(f)));
}

async function stream2buffer(stream: Stream): Promise<Buffer> {
    return new Promise < Buffer > ((resolve, reject) => {
        const _buf: any[] = [];
        stream.on('data', chunk => _buf.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(_buf)));
        stream.on('error', err => reject(`error converting stream - ${err}`));
    });
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

async function exportTestAssets(tarballContent: Buffer, files: string[], outputFileName: string) {
	const outputPath = `./src/test/generated/${outputFileName}`;
	const fileStructures = await crawlTarAssets(files);
	const tarballSampleBase64 = tarballContent.toString('base64');
	const totalFileCount = fileStructures.reduce((count, globPaths) => count + globPaths.length, 0);
	const output = createOutputContent({ totalFileCount, fileStructures, tarballSampleBase64 });

	writeFileSync(outputPath, output, 'utf8');
	console.log('generated output at ' + outputPath + ' for files: ', files);
}

async function generateTarSampleOne() {
	const files = ['./dev-assets/tarball-sample/unpacked/tar-root'];
	const tarballReadable = tar.create({ gzip: false }, files);
	const tarballContent = await stream2buffer(tarballReadable);
	await exportTestAssets(tarballContent, files, 'tarball-test-content.ts');
}

async function generateTarSampleTwo() {
	const tarFilePath = './dev-assets/pax-tgz-sample/packed/test.tar';
	const unpackedPath = './tmp/pax-tar-sample';
	const tarballContent = readFileSync(tarFilePath);
	mkdirpSync(unpackedPath);
	await tar.extract({file: tarFilePath, cwd: unpackedPath});
	await exportTestAssets(tarballContent, [unpackedPath], 'pax-header-test-content.ts');
}

async function main() {
	await generateTarSampleOne();
	await generateTarSampleTwo();
}

main().catch(console.error);
