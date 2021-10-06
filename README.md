# @obsidize/tar-browserify

Simple utility unpack small tar files in the browser.

This differs from other [npm tar modules](https://www.npmjs.com/search?q=tar) in that it contains no node-based dependencies like fs or streams.

*NOTE:* this module performs all its processing in-memory, so using this with large files is not recommended.

Pairs well with these modules:
- [pako](https://www.npmjs.com/package/pako) for gzip / unzip
- [path-browserify](https://www.npmjs.com/package/path-browserify) to further process raw file names

## Installation

- npm:

```bash
npm install --save @obsidize/tar-browserify
```

- git:

```bash
npm install --save git+https://github.com/jospete/obsidize-tar-browserify.git
```

## Usage

### Example

```typescript
import {Tarball, TarUtility} from '@obsidize/tar-browserify';

// Decode a tarball from some source
const sourceBuffer = Uint8Array.from([1, 2, 3, 4]);
const entries = Tarball.extract(sourceBuffer);

// Create a tarball from some given entry attributes
const tarballBuffer = Tarball.create([
	{
		header: {fileName: 'Test File.txt'},
		content: TarUtility.encodeString('This is a test file')
	}
]);
```

See the [Example Usage Spec](https://github.com/jospete/obsidize-tar-browserify/blob/master/tests/example-usage.spec.ts) to get a general feel for what this module can do.

## API

Source documentation can be found [here](https://jospete.github.io/obsidize-tar-browserify/)