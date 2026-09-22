import { describe, expect, it } from 'vitest';
import { fixFolderCase, isInFolder, renameFolderPaths } from '../src/core/paths';

describe('renameFolderPaths', () => {
	it('follows a renamed folder, including entries inside it', () => {
		expect(renameFolderPaths(['Foo', 'Foo/Bar', 'Foobar', 'Qux'], 'Foo', 'Baz')).toEqual(['Baz', 'Baz/Bar', 'Foobar', 'Qux']);
	});

	it('follows a moved parent folder', () => {
		expect(renameFolderPaths(['Foo/Bar'], 'Foo', 'Qux/Foo')).toEqual(['Qux/Foo/Bar']);
	});

	it('returns the same list when nothing matches', () => {
		const folders = ['Foo'];
		expect(renameFolderPaths(folders, 'Bar', 'Baz')).toBe(folders);
	});
});

describe('isInFolder', () => {
	it('matches the folder and everything inside it, with exact case', () => {
		expect(isInFolder('Foo/a.md', 'Foo')).toBe(true);
		expect(isInFolder('Foo/Bar/a.md', 'Foo')).toBe(true);
		expect(isInFolder('Foobar/a.md', 'Foo')).toBe(false);
		expect(isInFolder('foo/a.md', 'Foo')).toBe(false);
		expect(isInFolder('Foo/a.md', '')).toBe(false);
	});
});

describe('fixFolderCase', () => {
	it('corrects entries that only differ in case from an existing folder', () => {
		expect(fixFolderCase(['notes', 'Foo/bar', 'Missing'], ['Notes', 'Foo', 'Foo/Bar'])).toEqual(['Notes', 'Foo/Bar', 'Missing']);
	});

	it('keeps entries that exist as written, even when another folder differs only in case', () => {
		expect(fixFolderCase(['notes'], ['Notes', 'notes'])).toEqual(['notes']);
	});

	it('returns the same list when nothing needs fixing', () => {
		const folders = ['Notes'];
		expect(fixFolderCase(folders, ['Notes'])).toBe(folders);
	});
});
