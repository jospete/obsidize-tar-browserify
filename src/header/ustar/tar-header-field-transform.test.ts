import { TarHeaderFieldTransformType } from './tar-header-field-transform';

describe('TarHeaderFieldTransform', () => {
	describe('TarHeaderFieldTransformType', () => {
		describe('from()', () => {
			it('returns undefined if the given type does not have an associated transform', () => {
				expect(TarHeaderFieldTransformType.from(null as any)).not.toBeDefined();
			});
		});
	});
});
