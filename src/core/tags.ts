import { isInFolder } from './paths';

/** A note as seen by the tag tree. Tags are stored without `#`. */
export interface NoteEntry {
	path: string;
	/** Name shown in the tree: the note title or the file name. */
	name: string;
	mtime: number;
	ctime: number;
	tags: string[];
}

/** Strips a leading `#` and surrounding slashes, and lower-cases the tag. */
export function normalizeTag(tag: string): string {
	return tag.trim().replace(/^#/, '').replace(/^\/+|\/+$/g, '').toLowerCase();
}

/** The first segment of a tag: `domain/coding` -> `domain`. */
export function namespaceOf(tag: string): string {
	const slash = tag.indexOf('/');
	return slash === -1 ? tag : tag.slice(0, slash);
}

/** True when `tag` equals `ancestor` or is nested below it. Both must be normalized. */
export function isTagOrChild(tag: string, ancestor: string): boolean {
	return tag === ancestor || tag.startsWith(ancestor + '/');
}

/** Removes duplicate tags, ignoring case, and keeps the first spelling seen. */
export function uniqueTags(tags: string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const raw of tags) {
		const tag = raw.startsWith('#') ? raw.slice(1) : raw;
		const key = tag.toLowerCase();
		if (tag === '' || seen.has(key)) continue;
		seen.add(key);
		result.push(tag);
	}
	return result;
}

/** Adds every parent level of the given (normalized) tags: `foo/bar` also yields `foo`. Sorted. */
export function tagsWithParents(tags: Iterable<string>): string[] {
	const result = new Set<string>();
	for (const tag of tags) {
		const segments = tag.split('/');
		for (let i = 1; i <= segments.length; i++) result.add(segments.slice(0, i).join('/'));
	}
	return [...result].sort();
}

export interface NoteScope {
	excludedTags: string[];
	includedFolders: string[];
	excludedFolders: string[];
}

/** Whether a note belongs in the tree. Included folders narrow the vault down; exclusions always win. */
export function isNoteVisible(note: NoteEntry, scope: NoteScope): boolean {
	const inAny = (folders: string[]) => folders.some((folder) => isInFolder(note.path, folder));
	if (scope.includedFolders.length > 0 && !inAny(scope.includedFolders)) return false;
	if (inAny(scope.excludedFolders)) return false;
	return !note.tags.some((tag) => scope.excludedTags.some((excluded) => isTagOrChild(tag.toLowerCase(), excluded)));
}

/** The name shown for a note: its `title` property, else its first level-1 heading, else the file name. */
export function noteTitle(
	basename: string,
	frontmatter: Record<string, unknown> | undefined,
	headings: { heading: string; level: number }[] | undefined,
): string {
	const title = frontmatter?.title;
	if (typeof title === 'string' && title.trim() !== '') return title.trim();
	return headings?.find((h) => h.level === 1)?.heading || basename;
}
