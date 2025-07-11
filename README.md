# @obsidize/tar-browserify

Simple utility for packing and unpacking tar files in the browser.

Highlights:

- No node-based requires/imports (fully compatible in browser)
- Only one dependency (`tslib` to play nice with typescript projects)
- Inline extraction tools (examples below)
- Builder pattern for creating tarball files in-memory (examples below)
- Supports PAX header reading/writing

Pairs well with these modules:

- [pako](https://www.npmjs.com/package/pako) for gzip / unzip
- [path-browserify](https://www.npmjs.com/package/path-browserify) to further process raw file names

## Installation

```bash
npm install -P -E @obsidize/tar-browserify
```

## Usage

The below example can be tested with runkit on npm:

```typescript
import { Archive } from '@obsidize/tar-browserify'; // TypeScript
// const { Archive } = require('@obsidize/tar-browserify'); // NodeJS (Required for RunKit)

async function tarExample() {
  // Example 1 - Create an archive in-memory.
  const createdTarballBuffer = new Archive()
  .addTextFile('Test File.txt', 'This is a test file')
  .addBinaryFile('Some binary data.bin', new Uint8Array(10))
  .addDirectory('MyFolder')
  .addTextFile('MyFolder/a nested file.txt', 'this is under MyFolder')
  .toUint8Array();
  
  // Example 2 - Decode an archive from some Uint8Array source in-memory.
  const {entries} = await Archive.extract(createdTarballBuffer);
  const [firstFile] = entries;
  
  console.log(firstFile.fileName); // 'Test File.txt'
  console.log(firstFile.content); // Uint8Array object
  console.log(firstFile.getContentAsText()); // 'This is a test file'

  // Example 3 - Iterate over an archive source as a stream
  for await (const entry of Archive.read(createdTarballBuffer)) {
    // do some stuff with the entry...
  }
}

tarExample();
```

**NOTE:** for large files, it is better to use the provided async options:

```typescript
import {Archive, AsyncUint8ArrayLike} from '@obsidize/tar-browserify';

// Generalized wrapper for loading data in chunks.
// The caller must wrap whatever external storage they are using with this.
const asyncBuffer: AsyncUint8ArrayLike = {
  // fetch tarball file length from storage
  byteLength: 69420, /* TODO: preload the total source length in bytes and set it here */ }
  // read tarball data from storage
  // allows us to read the file in chunks rather than all at once
  read: async (offset: number, length: number): Promise<Uint8Array> => { /* TODO: return buffer from some source */ }
};

async function iterateOverBigTarFile() {  
  for await (const entry of Archive.read(asyncBuffer)) {
    if (entry.isFile()) {
      const content = await entry.readContentFrom(asyncBuffer);
      console.log(`got file data from ${entry.fileName} (${content.byteLength} bytes)`);
      // TODO: do some stuff with the content
    }
  }
}

iterateOverBigTarFile();
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
