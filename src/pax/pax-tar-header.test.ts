import { PaxTarHeader } from './pax-tar-header';

describe('PaxTarHeader', () => {
	it('should be creatable', () => {
		expect(new PaxTarHeader()).toBeTruthy();
	});
});
