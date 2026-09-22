import { describe, expect, it } from 'vitest';
import { rangeBetween } from '../src/core/select';

describe('rangeBetween', () => {
	const items = ['a', 'b', 'c', 'd', 'e'];

	it('returns the items from one to the other, in either direction', () => {
		expect(rangeBetween(items, 'b', 'd')).toEqual(['b', 'c', 'd']);
		expect(rangeBetween(items, 'd', 'b')).toEqual(['b', 'c', 'd']);
		expect(rangeBetween(items, 'c', 'c')).toEqual(['c']);
	});

	it('returns only the target when the start is not in the list', () => {
		expect(rangeBetween(items, 'x', 'c')).toEqual(['c']);
		expect(rangeBetween(items, undefined, 'c')).toEqual(['c']);
	});
});
