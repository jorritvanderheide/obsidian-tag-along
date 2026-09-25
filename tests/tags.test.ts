import { describe, expect, it } from 'vitest';
import {
	fileNameFor,
	isNoteVisible,
	type NoteEntry,
	noteTitle,
	renameHeading,
	tagsWithParents,
} from '../src/core/tags';

describe('tagsWithParents', () => {
	it('adds every parent level, without duplicates, sorted', () => {
		expect(tagsWithParents(['foo/bar', 'foo/baz/qux', 'quux'])).toEqual([
			'foo',
			'foo/bar',
			'foo/baz',
			'foo/baz/qux',
			'quux',
		]);
	});
});

describe('isNoteVisible', () => {
	const note = (path: string, ...tags: string[]): NoteEntry => ({ path, name: path, mtime: 0, ctime: 0, tags });
	const none = { excludedTags: [], includedFolders: [], excludedFolders: [] };

	it('shows everything by default', () => {
		expect(isNoteVisible(note('a.md', 'foo'), none)).toBe(true);
	});

	it('only shows notes inside included folders when any are set', () => {
		const scope = { ...none, includedFolders: ['Foo'] };
		expect(isNoteVisible(note('Foo/a.md'), scope)).toBe(true);
		expect(isNoteVisible(note('Foo/Bar/a.md'), scope)).toBe(true);
		expect(isNoteVisible(note('Foobar/a.md'), scope)).toBe(false);
		expect(isNoteVisible(note('a.md'), scope)).toBe(false);
	});

	it('leaves out excluded folders, also inside included ones', () => {
		const scope = { ...none, includedFolders: ['Foo'], excludedFolders: ['Foo/Bar'] };
		expect(isNoteVisible(note('Foo/a.md'), scope)).toBe(true);
		expect(isNoteVisible(note('Foo/Bar/a.md'), scope)).toBe(false);
	});

	it('leaves out notes with an excluded tag or sub-tag', () => {
		const scope = { ...none, excludedTags: ['foo'] };
		expect(isNoteVisible(note('a.md', 'Foo/Bar'), scope)).toBe(false);
		expect(isNoteVisible(note('a.md', 'foobar'), scope)).toBe(true);
	});
});

describe('noteTitle', () => {
	it('prefers the title property, then the first level-1 heading, then the file name', () => {
		expect(noteTitle('file', { title: ' Title ' }, [{ heading: 'Heading', level: 1 }])).toBe('Title');
		expect(noteTitle('file', { title: '' }, [{ heading: 'Sub', level: 2 }, { heading: 'Heading', level: 1 }])).toBe('Heading');
		expect(noteTitle('file', { title: 3 }, [])).toBe('file');
		expect(noteTitle('file', undefined, undefined)).toBe('file');
	});
});

describe('fileNameFor', () => {
	it('drops characters that file names and links cannot have', () => {
		expect(fileNameFor('Why is it like that?')).toBe('Why is it like that');
		expect(fileNameFor('a/b: c*d "e" <f> | #g ^h [i]')).toBe('ab cd e f g h i');
	});

	it('tidies up spaces and leading dots', () => {
		expect(fileNameFor('  .hidden   note \n')).toBe('hidden note');
	});

	it('returns an empty name when nothing is left', () => {
		expect(fileNameFor('???')).toBe('');
	});
});

describe('renameHeading', () => {
	const content = '---\ntitle: x\n---\n# Old name\nOld name again\n';
	const start = content.indexOf('# Old');
	const end = content.indexOf('\n', start);

	it('rewrites only the heading', () => {
		expect(renameHeading(content, start, end, 'Old name', 'New $& name')).toBe(
			'---\ntitle: x\n---\n# New $& name\nOld name again\n',
		);
	});

	it('leaves the content alone when the heading changed in the meantime', () => {
		expect(renameHeading(content, start, end, 'Other', 'New')).toBe(content);
	});
});
