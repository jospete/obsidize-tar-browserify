import { closeSync, openSync, readSync, writeFileSync } from 'node:fs';

function tryParseInt(value: any, defaultValue: number): number {
	if (typeof value === 'string') {
		const parsed = parseInt(value);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}

	return defaultValue;
}

function main() {
	let [inputFile, outputFile, offsetInput, byteLengthInput] = process.argv.slice(2);
	
	// defaults are to peel out a long-link sample from the node tarball
	inputFile = inputFile || `./tmp/node-download-test/node.tar`;
	outputFile = outputFile || `./dev-assets/long-link-sample/packed/long-link-sample.tar`;

	const offset = tryParseInt(offsetInput, 125287936);
	const byteLength = tryParseInt(byteLengthInput, 2340);
	const padding = 512 * 2;

	const tarFd = openSync(inputFile, 'r');
	const readBuffer = new Uint8Array(byteLength + padding);
	const bytesRead = readSync(tarFd, readBuffer, 0, byteLength, offset);

	if (bytesRead === byteLength) {
		writeFileSync(outputFile, readBuffer);
	} else {
		console.error(`failed to read input file segment (expected ${byteLength}, actual ${bytesRead})`);
	}

	closeSync(tarFd);
}

main();
