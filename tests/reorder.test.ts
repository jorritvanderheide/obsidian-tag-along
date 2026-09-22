import { describe, expect, it } from 'vitest';
import { isSamePlace, reorderFolders } from '../src/core/reorder';

describe('isSamePlace', () => {
	const siblings = ['aa', 'bb', 'cc'];

	it('is true right before the next folder and right after the previous one', () => {
		expect(isSamePlace(siblings, 'aa', 'bb', true)).toBe(true);
		expect(isSamePlace(siblings, 'bb', 'aa', false)).toBe(true);
	});

	it('is false for a place the folder is not in', () => {
		expect(isSamePlace(siblings, 'aa', 'bb', false)).toBe(false);
		expect(isSamePlace(siblings, 'aa', 'cc', true)).toBe(false);
		expect(isSamePlace(siblings, 'cc', 'aa', true)).toBe(false);
	});
});

describe('reorderFolders', () => {
	const siblings = ['aa', 'bb', 'cc'];

	it('writes down the whole level, with the folder in its new place', () => {
		expect(reorderFolders([], siblings, 'cc', 'aa', true)).toEqual(['cc', 'aa', 'bb']);
		expect(reorderFolders([], siblings, 'cc', 'aa', false)).toEqual(['aa', 'cc', 'bb']);
		expect(reorderFolders([], siblings, 'aa', 'cc', false)).toEqual(['bb', 'cc', 'aa']);
	});

	it('replaces an earlier order of the same level', () => {
		const order = reorderFolders([], siblings, 'cc', 'aa', true);
		expect(reorderFolders(order, ['cc', 'aa', 'bb'], 'aa', 'bb', false)).toEqual(['cc', 'bb', 'aa']);
	});

	it('keeps folders of other levels in the order they were in', () => {
		expect(reorderFolders(['xx/2', 'xx/1'], siblings, 'bb', 'aa', true)).toEqual(['xx/2', 'xx/1', 'bb', 'aa', 'cc']);
	});

	it('ignores a drop on a folder of another level', () => {
		expect(reorderFolders(['aa'], siblings, 'bb', 'xx/1', true)).toEqual(['aa']);
		expect(reorderFolders(['aa'], siblings, 'xx/1', 'bb', true)).toEqual(['aa']);
	});
});
