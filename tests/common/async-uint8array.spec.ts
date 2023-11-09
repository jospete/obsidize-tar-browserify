import { Constants, findInAsyncUint8Array } from '../../src';
import { MockAsyncUint8Array } from '../mocks/mock-async-uint8array';

describe('AsyncUint8Array', () => {

	describe('findInAsyncUint8Array', () => {

		it('searches through an AsyncUint8Array for a block that matches the given predicate', async () => {
			// TODO: figure out a pragmatic way to test this
			const mockInput = new MockAsyncUint8Array(new Uint8Array(Constants.SECTOR_SIZE * 2));
			const result = await findInAsyncUint8Array(mockInput, 0, 1, value => value.includes(42));
			expect(result).toBeDefined();
		});
	});
});