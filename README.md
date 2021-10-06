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

The below example can be tested with runkit on npm:

```typescript
import {Tarball, TarUtility} from '@obsidize/tar-browserify';
// or with runkit:
// const {Tarball, TarUtility} = tarBrowserify;

// Example 1 - Create a tarball from some given entry attributes
const createdTarball = Tarball.create([
	{
		header: {fileName: 'Test File.txt'},
		content: TarUtility.encodeString('This is a test file')
	}
]);

// Example 2 - Decode a tarball from some source
const entries = Tarball.extract(createdTarball);
const [mainFile] = entries;

console.log(mainFile.fileName); // 'Test File.txt'
console.log(mainFile.content); // Uint8Array object
console.log(TarUtility.decodeString(mainFile.content)); // 'This is a test file'
```

**NOTE:** for large files, it is better to use the provided async options:

```typescript
// unpack large files asynchronously to conserve memory
const entriesFromBigFile = await Tarball.extractAsync({
	
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