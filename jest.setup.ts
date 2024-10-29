import { TextDecoder, TextEncoder } from 'util';

class TextEncoderShim extends TextEncoder {
	encode(input?: string): Uint8Array {
		// Fixes issue with node's TextEncoder returning a
		// "Uint8Array-Like" object that is not an actual Uint8Array instance
		const nodeGarbage = super.encode(input);
		return new Uint8Array(nodeGarbage.buffer);
	}
}

global.TextEncoder = TextEncoderShim;

// node's TextDecoder is not exactly 1:1 with the browser TextDecoder interface,
// but this seems to work so whatever...
global.TextDecoder = <any>TextDecoder;
