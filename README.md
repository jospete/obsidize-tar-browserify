# @obsidize/tar-browserify

Simple utility to pack and unpack small tar files in the browser.

This differs from other [npm tar modules](https://www.npmjs.com/search?q=tar) in that it contains no node-based dependencies like fs or streams.

*NOTE:* this module performs all its processing in-memory, so using this with large files is not recommended.

Pairs well with [pako](https://www.npmjs.com/package/pako) for gzip / unzip.

## API

Source documentation can be found [here](https://jospete.github.io/obsidize-tar-browserify/)

## Usage

See the [Example Usage Spec](https://github.com/jospete/obsidize-tar-browserify/blob/master/tests/example-usage.spec.ts) to get a general feel for what this module can do.
