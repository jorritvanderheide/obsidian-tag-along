import { type App, getAllTags, type TFile } from 'obsidian';
import { isNoteVisible, type NoteEntry, normalizeTag, noteTitle, tagsWithParents, uniqueTags } from './core/tags';
import type { TagAlongSettings } from './settings';

/** Keeps the tags and display names of all Markdown notes up to date. */
export class NoteIndex {
	private readonly notes = new Map<string, NoteEntry>();
	private changes = 0;

	constructor(
		private readonly app: App,
		private readonly settings: () => TagAlongSettings,
	) {}

	/** Goes up whenever something shown in the tree may have changed. */
	get version(): number {
		return this.changes;
	}

	rebuild(): void {
		this.changes++;
		this.notes.clear();
		for (const file of this.app.vault.getMarkdownFiles()) this.update(file);
	}

	/** Re-reads one note. Returns true when something shown in the tree changed. */
	update(file: TFile): boolean {
		if (file.extension !== 'md') return false;
		const cache = this.app.metadataCache.getFileCache(file);
		const next: NoteEntry = {
			path: file.path,
			name: this.settings().showNoteTitles
				? noteTitle(file.basename, cache?.frontmatter, cache?.headings)
				: file.basename,
			mtime: file.stat.mtime,
			ctime: file.stat.ctime,
			tags: cache ? uniqueTags(getAllTags(cache) ?? []) : [],
		};
		const previous = this.notes.get(file.path);
		this.notes.set(file.path, next);
		const changed =
			!previous ||
			previous.name !== next.name ||
			previous.tags.join('\n') !== next.tags.join('\n') ||
			(this.sortsByDate() && (previous.mtime !== next.mtime || previous.ctime !== next.ctime));
		if (changed) this.changes++;
		return changed;
	}

	remove(path: string): boolean {
		const removed = this.notes.delete(path);
		if (removed) this.changes++;
		return removed;
	}

	/** Notes that should appear in the tree, after applying folders and excluded tags. */
	visibleNotes(): NoteEntry[] {
		const scope = this.settings();
		return [...this.notes.values()].filter((note) => isNoteVisible(note, scope));
	}

	/** Dates only change the tree when notes are sorted by them; otherwise typing does not redraw it. */
	private sortsByDate(): boolean {
		return !this.settings().noteSort.startsWith('name');
	}

	/** Every tag in the vault and its parent levels (normalized), for pickers. */
	allTags(): string[] {
		const tags = new Set<string>();
		for (const note of this.notes.values()) {
			for (const tag of note.tags) tags.add(normalizeTag(tag));
		}
		return tagsWithParents(tags);
	}
}
