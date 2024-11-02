import { InMemoryAsyncUint8Array } from './async-uint8-array';
import { Constants } from './constants';

describe('AsyncUint8ArrayLike', () => {
	describe('InMemoryAsyncUint8Array', () => {
		it('should be creatable', () => {
			const mockInput = new InMemoryAsyncUint8Array(new Uint8Array(Constants.SECTOR_SIZE * 2));
			expect(mockInput).toBeDefined();
		});
	});
});
