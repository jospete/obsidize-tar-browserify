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

async function makeSomeTarStuff() {
  // Example 1 - Create an archive in-memory.
  //
  // The Archive class implements several shorthand methods for
  // injecting content like so:
  const createdTarballBuffer = new Archive()
  .addTextFile('Test File.txt', 'This is a test file')
  .addBinaryFile('Some binary data.bin', new Uint8Array(10))
  .addDirectory('MyFolder')
  .addTextFile('MyFolder/a nested file.txt', 'this is under MyFolder')
  .toUint8Array();
  
  // Example 2 - Decode an archive from some Uint8Array source.
  //
  // Here we use the tarball we just created for demonstration purposes, 
  // but this could just as easily be a blob from a server, or a local file;
  // as long as the content is a Uint8Array that implements the tar format correctly.
  const {entries} = await Archive.extract(createdTarballBuffer);
  const [mainFile] = entries;
  
  console.log(mainFile.fileName); // 'Test File.txt'
  console.log(mainFile.content); // Uint8Array object
  console.log(mainFile.getContentAsText()); // 'This is a test file'
}

makeSomeTarStuff();
```

**NOTE:** for large files, it is better to use the provided async options:

```typescript
import {Archive, AsyncUint8ArrayLike, AsyncUint8ArrayIterator, ArchiveReader} from '@obsidize/tar-browserify';

// Generalized wrapper for loading data in chunks.
// The caller must wrap whatever external storage they are using with this.
const asyncBuffer: AsyncUint8ArrayLike = {
  // fetch tarball file length from storage
  byteLength: async (): Promise<number> => { /* TODO: return total source length in bytes */ }
  // read tarball data from storage
  // allows us to read the file in chunks rather than all at once
  read: async (offset: number, length: number): Promise<Uint8Array> => { /* TODO: return buffer from some source */ }
};

// Option 1 - extractFromStream()
// Preferred for files with few entries
async function readBigTarFileMetadata() {
  const bigFileArchive = await Archive.extractFromStream(asyncBuffer);
  
  // IMPORTANT - async entries do not load file content by default to conserve memory.
  // The caller must read file contents from an async entry like so:
  const [firstEntry] = bigFileArchive.entries;
  const firstEntryContent = await firstEntry.readContentFrom(asyncBuffer);
}

readBigTarFileMetadata();

// Option 2 - using iterators
// Preferred for files with many entries
async function iterateOverBigTarFile() {
  const iterator = new AsyncUint8ArrayIterator(asyncBuffer);
  const reader = new ArchiveReader(iterator);
  
  await reader.initialize();
  
  for await (const entry of reader) {
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

## v4.x to v5.x Migration (Quick Guide)

1. `Tarball` renamed to `Archive`

2. `Tarball.extract` renamed to `Archive.extract` (async is now mandatory with this)

```typescript
// v4.x
const entries = Tarball.extract(uint8Buffer);

// v5.x
const {entries} = await Archive.extract(uint8Buffer);
```

3. `Tarball.extractAsync` renamed to `Archive.extractFromStream`

```typescript
const asyncBuffer: AsyncUint8ArrayLike = {
  byteLength: async (): Promise<number> => { /* TODO: return total source length in bytes */ }
  read: async (offset: number, length: number): Promise<Uint8Array> => { /* TODO: return buffer from some source */ }
};

// v4.x
const entries = Tarball.extractAsync(asyncBuffer);

// v5.x
const {entries} = await Archive.extractFromStream(asyncBuffer);
```

For more granular info, see API docs

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
