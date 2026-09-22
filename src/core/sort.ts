import type { NoteEntry } from './tags';

export const NOTE_SORTS = ['name-asc', 'name-desc', 'modified-desc', 'modified-asc', 'created-desc', 'created-asc'] as const;
export type NoteSort = (typeof NOTE_SORTS)[number];

export const FOLDER_SORTS = ['name-asc', 'name-desc', 'count-desc', 'count-asc'] as const;
export type FolderSort = (typeof FOLDER_SORTS)[number];

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const byName = (a: string, b: string) => collator.compare(a, b);

/** Orders notes. Notes with the same date are ordered by name. */
export function compareNotes(sort: NoteSort): (a: NoteEntry, b: NoteEntry) => number {
	const name = (a: NoteEntry, b: NoteEntry) => byName(a.name, b.name) || byName(a.path, b.path);
	switch (sort) {
		case 'name-asc':
			return name;
		case 'name-desc':
			return (a, b) => name(b, a);
		case 'modified-desc':
			return (a, b) => b.mtime - a.mtime || name(a, b);
		case 'modified-asc':
			return (a, b) => a.mtime - b.mtime || name(a, b);
		case 'created-desc':
			return (a, b) => b.ctime - a.ctime || name(a, b);
		case 'created-asc':
			return (a, b) => a.ctime - b.ctime || name(a, b);
	}
}

/** Orders folders by name or by how many notes they hold. Folders with the same count are ordered by name. */
export function compareFolders(sort: FolderSort): (a: { label: string; count: number }, b: { label: string; count: number }) => number {
	switch (sort) {
		case 'name-asc':
			return (a, b) => byName(a.label, b.label);
		case 'name-desc':
			return (a, b) => byName(b.label, a.label);
		case 'count-desc':
			return (a, b) => b.count - a.count || byName(a.label, b.label);
		case 'count-asc':
			return (a, b) => a.count - b.count || byName(a.label, b.label);
	}
}
