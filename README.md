# @obsidize/tar-browserify

Simple utility for packing and unpacking tar files in the browser.

Highlights:

- Zero dependencies
- No node-based requires/imports (fully compatible in browser)
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

### Read a tar file

```typescript
import { ungzip } from 'pako';
import { Archive } from '@obsidize/tar-browserify';

async function readTarFile() {
  const response = await fetch('url/to/some/file.tar.gz');
  const gzBuffer = await response.arrayBuffer();
  const tarBuffer = ungzip(gzBuffer);

  for await (const entry of Archive.read(tarBuffer)) {
    if (entry.isFile()) {
      console.log(`read tar file: ${entry.fileName} with content length ${entry.content!.byteLength}`);
      console.log(`file text contents: ${entry.text()}`);
      // TODO: do something interesting with the file
    }
  }
}

readTarFile().catch(console.error);
```

### Write a tar file

```typescript
import { gzip } from 'pako';
import { Archive } from '@obsidize/tar-browserify';

async function writeTarFile() {
  const tarBuffer = new Archive()
    .addDirectory('MyStuff')
    .addTextFile('MyStuff/todo.txt', 'This is my TODO list')
    .addBinaryFile('MyStuff/some-raw-file.obj', Uint8Array.from([1, 2, 3, 4, 5]))
    .addDirectory('Nested1')
    .addDirectory('Nested1/Nested2')
    .addBinaryFile('Nested1/Nested2/supersecret.bin', Uint8Array.from([6, 7, 8, 9]))
    .toUint8Array();

  const gzBuffer = gzip(tarBuffer);
  const fileToSend = new File([gzBuffer], 'my-awesome-new-file.tar.gz');
  // TODO: send the new file somewhere
}

writeTarFile().catch(console.error);
```

### Modify an existing tar file

```typescript
import { gzip, ungzip } from 'pako';
import { Archive } from '@obsidize/tar-browserify';

async function modifyTarFile() {
  const response = await fetch('url/to/some/file.tar.gz');
  const gzBuffer = await response.arrayBuffer();
  const tarBuffer = ungzip(gzBuffer);
  const archive = await Archive.extract(tarBuffer);

  const updatedTarBuffer = archive
    .removeEntriesWhere(entry => /unwanted\-file\-name\.txt/.test(entry.fileName))
    .cleanAllHeaders() // remove unwanted metadata
    .addTextFile('new text file.txt', 'this was added to the original tar file!')
    .toUint8Array();

  const updatedGzBuffer = gzip(updatedTarBuffer);
  const fileToSend = new File([updatedGzBuffer], 'my-awesome-edited-file.tar.gz');
  // TODO: send the modified file somewhere
}

modifyTarFile().catch(console.error);
```

### Read a BIG tar file (Advanced)

For very large files (>= 50MB) it is better to use the `AsyncUint8ArrayLike`
interface for loading the file in chunks (either from disk or over a network)

```typescript
import { Archive, AsyncUint8ArrayLike } from '@obsidize/tar-browserify';

async function readBigTarFile() {
  const customAsyncBuffer: AsyncUint8ArrayLike = {
    byteLength: 12345, // the file length in bytes must be known ahead of time
    read: (offset: number, length: number): Promise<Uint8Array> => /* TODO: return chunk from disk or network request */
  };

  for await (const entry of Archive.read(customAsyncBuffer)) {
    if (!entry.isFile()) {
      continue;
    }

    let offset = 0; // offset into this entry's file content
    let chunkSize = 1024; // read 1Kb at a time

    while (offset < entry.fileSize) {
      const fileChunk = await entry.readContentFrom(customAsyncBuffer, offset, chunkSize);
      offset += fileChunk.byteLength;
      // TODO: do something interesting with the file data
    }
  }
}

readBigTarFile().catch(console.error);
```

## API

Full API docs can be found in the repo [GitHub Docs Page](https://jospete.github.io/obsidize-tar-browserify/)

## Testing

This module has a full [Test Suite](https://github.com/jospete/obsidize-tar-browserify/tree/master/tests)
to ensure breaking changes are not introduced, and is tested against the output
of the [node-tar](https://www.npmjs.com/package/tar) package to ensure stability.

- `npm test` - run unit tests with live-reload.
- `npm run coverage` - perform a single-pass of unit tests with code-coverage display.
