# @obsidize/tar-browserify

Simple utility for packing and unpacking tar files in the browser.

This differs from other [npm tar modules](https://www.npmjs.com/search?q=tar) in that it contains no node-based dependencies like ```fs``` or ```streams```.

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

// To unpack large files, use extractAsync() to conserve memory
const entries = await Tarball.extractAsync({
	
	// fetch tarball file length from storage
	byteLength: () => ... /* Promise<number> */
	
	// read tarball data from storage
	// allows us to read the file in chunks rather than all at once
	read: (offset: number, length: number) => ... /* Promise<Uint8Array> */
});
```

See the [Example Usage Spec](https://github.com/jospete/obsidize-tar-browserify/blob/master/tests/example-usage.spec.ts) to get a general feel for what this module can do.

## API

Source documentation can be found [here](https://jospete.github.io/obsidize-tar-browserify/)

## Testing

This module is tested against the output of the [node-tar](https://www.npmjs.com/package/tar) package to ensure stability.

See package scripts for available test options.