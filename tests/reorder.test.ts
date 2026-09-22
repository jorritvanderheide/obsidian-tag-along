import { describe, expect, it } from 'vitest';
import { type FolderOrder, isSamePlace, reorderFolders } from '../src/core/reorder';

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
	const order = (folderOrder: string[] = [], folderOrderEnd: string[] = []): FolderOrder => ({
		folderOrder,
		folderOrderEnd,
	});

	it('writes down the level up to the drop, leaving the rest to the sort order', () => {
		expect(reorderFolders(order(), siblings, 'cc', 'aa', true)).toEqual(order(['cc']));
		expect(reorderFolders(order(), siblings, 'cc', 'aa', false)).toEqual(order(['aa', 'cc']));
	});

	it('keeps a folder dropped below all the others last', () => {
		expect(reorderFolders(order(), siblings, 'aa', 'cc', false)).toEqual(order([], ['aa']));
	});

	it('joins a folder dropped next to the ones kept last', () => {
		expect(reorderFolders(order(['aa'], ['cc']), siblings, 'bb', 'cc', false)).toEqual(order(['aa'], ['cc', 'bb']));
		expect(reorderFolders(order([], ['cc']), siblings, 'aa', 'cc', true)).toEqual(order([], ['aa', 'cc']));
	});

	it('takes a folder kept last back out when it is dropped higher up', () => {
		expect(reorderFolders(order([], ['cc']), siblings, 'cc', 'aa', true)).toEqual(order(['cc']));
	});

	it('replaces an earlier order of the same level', () => {
		const first = reorderFolders(order(), siblings, 'cc', 'aa', true);
		expect(first).toEqual(order(['cc']));
		// 'bb' is left alone in the middle, so it keeps following the sort order.
		expect(reorderFolders(first, ['cc', 'aa', 'bb'], 'aa', 'bb', false)).toEqual(order(['cc'], ['aa']));
	});

	it('keeps folders of other levels in the order they were in', () => {
		expect(reorderFolders(order(['xx/2', 'xx/1']), siblings, 'bb', 'aa', true)).toEqual(order(['xx/2', 'xx/1', 'bb']));
	});

	it('ignores a drop on a folder of another level', () => {
		expect(reorderFolders(order(['aa']), siblings, 'bb', 'xx/1', true)).toEqual(order(['aa']));
		expect(reorderFolders(order(['aa']), siblings, 'xx/1', 'bb', true)).toEqual(order(['aa']));
	});
});
