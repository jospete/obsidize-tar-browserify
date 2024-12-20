import { UstarHeaderFieldTransformType } from './ustar-header-field-transform';

describe('UstarHeaderFieldTransform', () => {
	describe('TarHeaderFieldTransformType', () => {
		describe('from()', () => {
			it('returns undefined if the given type does not have an associated transform', () => {
				expect(UstarHeaderFieldTransformType.from(null as any)).not.toBeDefined();
			});
		});
	});
});
