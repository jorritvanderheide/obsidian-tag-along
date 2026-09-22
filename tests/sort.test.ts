import { describe, expect, it } from 'vitest';
import { compareFolders, compareNotes } from '../src/core/sort';
import type { NoteEntry } from '../src/core/tags';

const note = (name: string, mtime: number, ctime: number): NoteEntry => ({ path: `${name}.md`, name, mtime, ctime, tags: [] });
const notes = [note('b10', 1, 30), note('B2', 3, 10), note('a', 2, 20), note('c', 3, 10)];
const names = (sorted: NoteEntry[]) => sorted.map((n) => n.name);

describe('compareNotes', () => {
	it('sorts by name naturally, ignoring case', () => {
		expect(names([...notes].sort(compareNotes('name-asc')))).toEqual(['a', 'B2', 'b10', 'c']);
		expect(names([...notes].sort(compareNotes('name-desc')))).toEqual(['c', 'b10', 'B2', 'a']);
	});

	it('sorts by modified and created time, with names breaking ties', () => {
		expect(names([...notes].sort(compareNotes('modified-desc')))).toEqual(['B2', 'c', 'a', 'b10']);
		expect(names([...notes].sort(compareNotes('modified-asc')))).toEqual(['b10', 'a', 'B2', 'c']);
		expect(names([...notes].sort(compareNotes('created-desc')))).toEqual(['b10', 'a', 'B2', 'c']);
		expect(names([...notes].sort(compareNotes('created-asc')))).toEqual(['B2', 'c', 'a', 'b10']);
	});
});

describe('compareFolders', () => {
	const folders = [
		{ label: 'beta', count: 2 },
		{ label: 'Alpha', count: 5 },
		{ label: 'gamma', count: 2 },
	];
	const labels = (sort: Parameters<typeof compareFolders>[0]) => [...folders].sort(compareFolders(sort)).map((f) => f.label);

	it('sorts by name or note count, with names breaking ties', () => {
		expect(labels('name-asc')).toEqual(['Alpha', 'beta', 'gamma']);
		expect(labels('name-desc')).toEqual(['gamma', 'beta', 'Alpha']);
		expect(labels('count-desc')).toEqual(['Alpha', 'beta', 'gamma']);
		expect(labels('count-asc')).toEqual(['beta', 'gamma', 'Alpha']);
	});
});
