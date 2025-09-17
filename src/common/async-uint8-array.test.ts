import { InMemoryAsyncUint8Array } from './async-uint8-array.ts';
import { Constants } from './constants.ts';

describe('AsyncUint8ArrayLike', () => {
	describe('InMemoryAsyncUint8Array', () => {
		it('should be creatable', () => {
			const mockInput = new InMemoryAsyncUint8Array(new Uint8Array(Constants.SECTOR_SIZE * 2));
			expect(mockInput).toBeDefined();
		});
	});
});
