import { AsyncUint8Array } from './async-uint8array';

export class MockAsyncUint8Array implements AsyncUint8Array {

	constructor(
		public data: Uint8Array
	) {
	}

	public async byteLength(): Promise<number> {
		return this.data.byteLength;
	}

	public async read(offset: number, length: number): Promise<Uint8Array> {
		return this.data.slice(offset, offset + length);
	}
}