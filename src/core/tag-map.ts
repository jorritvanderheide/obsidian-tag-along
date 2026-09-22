import { isTagOrChild, namespaceOf, type NoteEntry, normalizeTag } from './tags';

export interface TagMapOptions {
	/** Tags that, with their sub-tags, get no folder. Notes still appear under their other tags. */
	hiddenFolders: string[];
	/**
	 * Sub-tags that move out of their parent and become top-level folders of their own, as if they
	 * had been written without their parent.
	 */
	topLevelFolders: string[];
}

/**
 * Decides which tags each note has in the tree: tags below a sub-tag moved to the top level are
 * rewritten as if they had no parent, and hidden folders are dropped. Also maps tree folders back
 * to the tags they came from.
 */
export class TagMap {
	private readonly tags = new Map<NoteEntry, { shown: string[]; lower: string[] }>();
	/** Moved sub-tags, deepest first so nested ones win. */
	private readonly moved: string[];
	/** Top-level names that also exist without any moved tag. */
	private readonly plainNamespaces = new Set<string>();
	/** Moved sub-tags by the top-level name they get, deepest first. */
	private readonly movedByName = new Map<string, string[]>();

	constructor(
		notes: NoteEntry[],
		private readonly options: TagMapOptions,
	) {
		this.moved = [...options.topLevelFolders].sort((a, b) => b.split('/').length - a.split('/').length);
		for (const tag of this.moved) push(this.movedByName, lastSegment(tag), tag);
		for (const note of notes) this.tags.set(note, this.map(note.tags));
	}

	/** The tags of a note as shown in the tree, in their original spelling. */
	tagsOf(note: NoteEntry): string[] {
		return this.tags.get(note)?.shown ?? [];
	}

	/** The same tags as `tagsOf`, lower-cased, in the same order. */
	lowerTagsOf(note: NoteEntry): string[] {
		return this.tags.get(note)?.lower ?? [];
	}

	/** The tag a folder stands for, or null when it merges a moved tag with a namespace of the same name. */
	originalTag(tag: string): string | null {
		const namespace = namespaceOf(tag);
		const sources = this.movedFrom(namespace);
		if (sources.length === 0) return tag;
		if (sources.length > 1 || this.plainNamespaces.has(namespace)) return null;
		return sources[0] + tag.slice(namespace.length);
	}

	/** Where a tag written in a note is shown in the tree (lower-case), or undefined when it is hidden. */
	shownTag(tag: string): string | undefined {
		const original = normalizeTag(tag);
		const moved = this.movedTagOf(original);
		const shown = moved ? withoutParent(original, moved) : original;
		return this.isHidden(original, shown, moved) ? undefined : shown;
	}

	/**
	 * Where each of `sources` is shown in the tree (lower-case), for settings that point at folders.
	 * Hidden tags are dropped, and tags that end up in the same folder are kept once, the first one.
	 * Not for `hiddenFolders` and `topLevelFolders`: those shape the mapping instead of following it.
	 */
	shownTags(sources: readonly string[]): string[] {
		const shown: string[] = [];
		for (const source of sources) {
			const tag = this.shownTag(source);
			if (tag !== undefined && !shown.includes(tag)) shown.push(tag);
		}
		return shown;
	}

	/** The sub-tags moved into the top-level folder `namespace`. */
	movedFrom(namespace: string): readonly string[] {
		return this.movedByName.get(namespace) ?? [];
	}

	private map(noteTags: string[]): { shown: string[]; lower: string[] } {
		const shown: string[] = [];
		const lower: string[] = [];
		for (const tag of noteTags) {
			const original = tag.toLowerCase();
			const moved = this.movedTagOf(original);
			const effective = moved ? withoutParent(tag, moved) : tag;
			const effectiveLower = moved ? withoutParent(original, moved) : original;
			if (this.isHidden(original, effectiveLower, moved)) continue;
			if (!moved) this.plainNamespaces.add(namespaceOf(original));
			// Two tags can end up the same, e.g. `foo/bar` moved next to a plain `bar`; keep the first.
			if (lower.includes(effectiveLower)) continue;
			shown.push(effective);
			lower.push(effectiveLower);
		}
		return { shown, lower };
	}

	/**
	 * A tag is hidden when a hidden folder covers where it is shown, or where it came from. Hiding the
	 * parent of a moved tag does not hide it: it no longer lives there.
	 */
	private isHidden(original: string, effective: string, moved: string | undefined): boolean {
		return this.options.hiddenFolders.some(
			(hidden) =>
				isTagOrChild(effective, hidden) || (isTagOrChild(original, hidden) && !moved?.startsWith(hidden + '/')),
		);
	}

	private movedTagOf(lowerTag: string): string | undefined {
		return this.moved.find((tag) => isTagOrChild(lowerTag, tag));
	}
}

/** Rewrites a tag below the moved sub-tag `moved` as if it had no parent: `foo/bar/x` becomes `bar/x`. */
function withoutParent(tag: string, moved: string): string {
	return tag
		.split('/')
		.slice(moved.split('/').length - 1)
		.join('/');
}

function push(map: Map<string, string[]>, key: string, value: string): void {
	const list = map.get(key);
	if (list) list.push(value);
	else map.set(key, [value]);
}

function lastSegment(tag: string): string {
	return tag.slice(tag.lastIndexOf('/') + 1);
}
