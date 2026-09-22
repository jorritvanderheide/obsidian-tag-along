import { describe, expect, it } from 'vitest';
import { LastResult } from '../src/core/cache';

describe('LastResult', () => {
	it('recomputes only when one of the inputs changed', () => {
		let calls = 0;
		const cache = new LastResult((version: number, settings: object) => ({ version, settings, call: ++calls }));
		const settings = {};
		const first = cache.get(1, settings);
		expect(cache.get(1, settings)).toBe(first);
		expect(cache.get(2, settings).call).toBe(2);
		expect(cache.get(2, {}).call).toBe(3);
		expect(calls).toBe(3);
	});
});
