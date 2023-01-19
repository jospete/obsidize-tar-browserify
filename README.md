# @obsidize/tar-browserify

Simple utility for packing and unpacking tar files in the browser.

This differs from other [npm tar modules](https://www.npmjs.com/search?q=tar) 
in that it contains no node-based dependencies like ```fs``` or ```streams```.

Pairs well with these modules:
- [pako](https://www.npmjs.com/package/pako) for gzip / unzip
- [path-browserify](https://www.npmjs.com/package/path-browserify) to further process raw file names

## Installation

```bash
npm install -P -E @obsidize/tar-browserify
```

## Usage

### Example

The below example can be tested with runkit on npm:

```typescript
import { Tarball } from '@obsidize/tar-browserify';

// or with runkit:
// const { Tarball } = require('@obsidize/tar-browserify');

// Example 1 - Create a tarball from some given entry attributes.
//
// The Tarball class implements several shorthand methods for
// injecting content like so:
const createdTarball = new Tarball()
	.addTextFile('Test File.txt', 'This is a test file')
	.addBinaryFile('Some binary data.bin', new Uint8Array(10))
	.addDirectory('MyFolder')
	.addTextFile('MyFolder/a nested file.txt', 'this is under MyFolder')
	.toUint8Array();

// Example 2 - Decode a tarball from some Uint8Array source.
//
// Here we use the tarball we just created for demonstration purposes, 
// but this could just as easily be a blob from a server, or a local file;
// as long as the content is a Uint8Array that implements the tar format correctly.
const entries = Tarball.extract(createdTarball);
const [mainFile] = entries;

console.log(mainFile.fileName); // 'Test File.txt'
console.log(mainFile.content); // Uint8Array object
console.log(mainFile.getContentAsText()); // 'This is a test file'
```

**NOTE:** for large files, it is better to use the provided async options:

```typescript
import {Tarball, AsyncUint8Array} from '@obsidize/tar-browserify';

// Generalized wrapper for loading data in chunks.
// The caller must wrap whatever external storage they are using with this.
const asyncBuffer: AsyncUint8Array = {
	
	// fetch tarball file length from storage
	byteLength: async () => ... /* Promise<number> */
	
	// read tarball data from storage
	// allows us to read the file in chunks rather than all at once
	read: async (offset: number, length: number) => ... /* Promise<Uint8Array> */
};

// unpack large files asynchronously to conserve memory
const entriesFromBigFile = await Tarball.extractAsync(asyncBuffer);

// IMPORTANT - async entries do not load file content by default to conserve memory.
// The caller must read file contents from an async entry like so:
const [firstEntry] = entriesFromBigFile;
const firstEntryContent = await firstEntry.readContentFrom(asyncBuffer);
```

## API

Full API docs can be found [here](https://jospete.github.io/obsidize-tar-browserify/)

## Testing

This module has a full [Test Suite](https://github.com/jospete/obsidize-tar-browserify/tree/master/tests) 
to ensure breaking changes are not introduced, and is tested against the output 
of the [node-tar](https://www.npmjs.com/package/tar) package to ensure stability.

- `npm test` - run unit tests with live-reload.
- `npm run coverage` - perform a single-pass of unit tests with code-coverage display.

## Building From Source

- clone this repo
- run `npm install`
- run `npm run build`

The output will be in `./dist`