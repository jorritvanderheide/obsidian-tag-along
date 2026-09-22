import { describe, expect, it } from 'vitest';
import { TagMap, type TagMapOptions } from '../src/core/tag-map';
import type { NoteEntry } from '../src/core/tags';

function note(name: string, ...tags: string[]): NoteEntry {
	return { path: `${name}.md`, name, mtime: 0, ctime: 0, tags };
}

function map(notes: NoteEntry[], options: Partial<TagMapOptions> = {}): TagMap {
	return new TagMap(notes, { hiddenFolders: [], topLevelFolders: [], ...options });
}

describe('TagMap', () => {
	describe('tagsOf', () => {
		it('keeps tags as written when nothing is moved or hidden', () => {
			const a = note('A', 'Foo/Bar', 'foo/bar', 'qux');
			expect(map([a]).tagsOf(a)).toEqual(['Foo/Bar', 'qux']);
		});

		it('rewrites tags below a sub-tag moved to the top level, keeping their spelling', () => {
			const a = note('A', 'Foo/Bar/x', 'foo/qux');
			expect(map([a], { topLevelFolders: ['foo/bar'] }).tagsOf(a)).toEqual(['Bar/x', 'foo/qux']);
		});

		it('drops hidden tags and their sub-tags', () => {
			const a = note('A', 'foo/bar', 'foo/bar/x', 'foo/barn');
			expect(map([a], { hiddenFolders: ['foo/bar'] }).tagsOf(a)).toEqual(['foo/barn']);
		});

		it('keeps a moved sub-tag when its parent is hidden, but not when it is hidden itself', () => {
			const a = note('A', 'foo/bar/x');
			expect(map([a], { topLevelFolders: ['foo/bar'], hiddenFolders: ['foo'] }).tagsOf(a)).toEqual(['bar/x']);
			expect(map([a], { topLevelFolders: ['foo/bar'], hiddenFolders: ['foo/bar'] }).tagsOf(a)).toEqual([]);
			expect(map([a], { topLevelFolders: ['foo/bar'], hiddenFolders: ['bar'] }).tagsOf(a)).toEqual([]);
		});
	});

	describe('mapping folders back', () => {
		it('maps folders back to the tags they came from', () => {
			const m = map([note('A', 'foo/bar/x')], { topLevelFolders: ['foo/bar'] });
			expect(m.originalTag('bar/x')).toBe('foo/bar/x');
			expect(m.originalTag('qux/x')).toBe('qux/x');
			expect(m.movedFrom('bar')).toEqual(['foo/bar']);
			expect(m.movedFrom('qux')).toEqual([]);
		});

		it('maps back when the namespace of the same name is hidden', () => {
			const m = map([note('A', 'foo/bar/x'), note('B', 'bar/y')], {
				topLevelFolders: ['foo/bar'],
				hiddenFolders: ['bar/y'],
			});
			expect(m.originalTag('bar/x')).toBe('foo/bar/x');
		});

		it('cannot map back when a moved tag merged with a namespace', () => {
			const m = map([note('A', 'foo/bar/x'), note('B', 'bar/y')], { topLevelFolders: ['foo/bar'] });
			expect(m.originalTag('bar/x')).toBeNull();
		});

		it('lists the sub-tags moved into a top-level folder, deepest first', () => {
			const m = map([note('A', 'foo/bar/baz'), note('B', 'qux')], { topLevelFolders: ['foo/bar', 'foo/bar/baz'] });
			expect(m.movedFrom('baz')).toEqual(['foo/bar/baz']);
			expect(m.movedFrom('qux')).toEqual([]);
		});
	});
});
