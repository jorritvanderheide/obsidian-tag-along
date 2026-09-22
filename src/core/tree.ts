import { compareFolders, compareNotes, type FolderSort, type NoteSort } from './sort';
import { TagMap, type TagMapOptions } from './tag-map';
import { isTagOrChild, namespaceOf, type NoteEntry } from './tags';

export interface TreeOptions extends TagMapOptions {
	/** Merge a folder with its only sub-folder when the folder has no notes of its own. */
	compactFolders: boolean;
	/** Offer folders that narrow a folder's notes down by another namespace. */
	filterFolders: boolean;
	/** Show notes without tags at the top level. */
	showUntagged: boolean;
	/** Folders ordered by hand, shown before the ones left to the sort order. */
	folderOrder: string[];
	noteSort: NoteSort;
	folderSort: FolderSort;
}

export interface FolderNode {
	/** `folder` is a tag folder; `filter` narrows the parent's notes by another namespace. */
	kind: 'folder' | 'filter';
	/** Stable identifier, unique within the tree. Used to remember expanded folders. */
	key: string;
	/** Tags merged into this node, outermost first. Longer than one when compacted. */
	chain: string[];
	label: string;
	/** Every note below this node. */
	notes: NoteEntry[];
	/** Namespaces already visited on the way here; not offered again as filters. */
	namespaces: string[];
	/** True for folders directly at the top of the tree. */
	isTopLevel: boolean;
	parent: FolderNode | undefined;
}

export interface Children {
	folders: FolderNode[];
	notes: NoteEntry[];
	filters: FolderNode[];
}

interface Group {
	tag: string;
	notes: NoteEntry[];
}

interface Groups {
	folders: Group[];
	notes: NoteEntry[];
}

// Tags never contain line breaks, so this cannot collide with a tag.
const KEY_SEPARATOR = '\n';

/** True when the folder with key `key` is somewhere inside the folder with key `ancestorKey`. */
export function isInsideFolder(key: string, ancestorKey: string): boolean {
	return key.startsWith(ancestorKey + KEY_SEPARATOR);
}


/**
 * Builds the tag tree lazily: a folder's children are computed the first time they are requested.
 * Create a new instance whenever the notes or options change.
 */
export class TagTree {
	/** How notes' tags are rewritten for the tree: moved and hidden folders. */
	readonly tags: TagMap;
	/** How each folder's notes split up, computed when the folder is created. */
	private readonly groups = new WeakMap<FolderNode, Groups>();
	private readonly childCache = new WeakMap<FolderNode, Children>();
	private rootCache: Children | undefined;
	/** Display names of folders, worked out when a folder is first shown. */
	private readonly labels = new Map<string, string>();
	/** Where each folder ordered by hand goes among its siblings, by tag. */
	private readonly orderRank = new Map<string, number>();

	// An index of the whole tree, built once, so opening a folder is a lookup instead of a scan.
	/** Notes with this tag or a tag below it. */
	private readonly notesUnder = new Map<string, NoteEntry[]>();
	/** The direct sub-folders of each tag. */
	private readonly subfolders = new Map<string, Set<string>>();
	/** Notes for which this is the deepest tag in its branch; they are listed directly in the folder. */
	private readonly notesDirectlyIn = new Map<string, NoteEntry[]>();

	constructor(
		private readonly notes: NoteEntry[],
		private readonly options: TreeOptions,
	) {
		this.tags = new TagMap(notes, options);
		options.folderOrder.forEach((tag, index) => this.orderRank.set(tag, index));
		for (const note of notes) this.addToIndex(note, this.tags.lowerTagsOf(note));
	}

	/**
	 * The tags a folder stands for, deepest first, as written in notes (so `bar` moved from `foo/bar`
	 * gives `foo/bar`). Falls back to the shown tag when a folder merges several sources.
	 */
	sourceTags(node: FolderNode): string[] {
		return [...node.chain].reverse().map((tag) => this.tags.originalTag(tag) ?? tag);
	}

	/**
	 * The tags that lead to a folder, one per namespace and as written in notes, from the top down.
	 * A folder inside a filter folder gives e.g. `source/book` and `status/active`.
	 */
	pathTags(node: FolderNode): string[] {
		const byNamespace = new Map<string, string>();
		for (let current: FolderNode | undefined = node; current; current = current.parent) {
			const tag = current.chain[current.chain.length - 1];
			if (current.kind !== 'folder' || tag === undefined) continue;
			const namespace = namespaceOf(tag);
			if (!byNamespace.has(namespace)) byNamespace.set(namespace, this.writtenTag(tag, current.notes));
		}
		return [...byNamespace.values()].reverse();
	}

	/** The folders to open to reach the folder of `tag` (as written in a note), or undefined when it is not shown. */
	pathToTag(tag: string): FolderNode[] | undefined {
		const shown = this.tags.shownTag(tag);
		return shown === undefined ? undefined : this.pathToShownTag(shown);
	}

	/**
	 * The folders to open to reach a note: the folder of its deepest tag in the first top-level folder
	 * that holds it. Undefined when the note is not in the tree.
	 */
	pathToNote(path: string): FolderNode[] | undefined {
		const note = this.notes.find((n) => n.path === path);
		if (!note) return undefined;
		const tags = this.tagsOf(note);
		for (const folder of this.root().folders) {
			const namespace = folder.chain[0] ?? '';
			const deepest = tags.find((tag) => isTagOrChild(tag, namespace) && !tags.some((other) => other.startsWith(tag + '/')));
			if (deepest) return this.pathToShownTag(deepest);
		}
		return undefined;
	}

	private pathToShownTag(tag: string): FolderNode[] | undefined {
		const path: FolderNode[] = [];
		let folders = this.root().folders;
		for (;;) {
			const node = folders.find((n) => isTagOrChild(tag, n.chain[0] ?? ''));
			if (!node) return undefined;
			path.push(node);
			// A compacted folder may stand for the tag somewhere in its chain.
			if (node.chain.includes(tag)) return path;
			folders = this.children(node).folders;
		}
	}

	/** A shown tag as written in the notes it came from, e.g. `Foo/Bar` for the moved `bar`. */
	private writtenTag(tag: string, notes: NoteEntry[]): string {
		const original = this.tags.originalTag(tag) ?? tag;
		for (const written of notes[0]?.tags ?? []) {
			const lower = written.toLowerCase();
			if (lower.length === written.length && (lower === original || lower.startsWith(original + '/'))) {
				return written.slice(0, original.length);
			}
		}
		return original;
	}

	root(): Children {
		this.rootCache ??= this.computeRoot();
		return this.rootCache;
	}

	private computeRoot(): Children {
		const untagged = this.notes.filter((note) => this.tagsOf(note).length === 0);
		const folders = [...this.notesUnder]
			.filter(([tag]) => !tag.includes('/'))
			.map(([namespace, notes]) => this.createNode('folder', namespace, notes, [namespace], undefined));
		return {
			folders: this.orderByHand(this.sortFolders(folders)),
			notes: this.options.showUntagged ? this.sortNotes(untagged) : [],
			filters: [],
		};
	}

	children(node: FolderNode): Children {
		const cached = this.childCache.get(node);
		if (cached) return cached;
		const groups = this.groups.get(node) ?? { folders: [], notes: [] };
		const children: Children = {
			folders: this.orderByHand(
				this.sortFolders(
					groups.folders.map((group) =>
						this.createNode('folder', group.tag, group.notes, node.namespaces, node),
					),
				),
			),
			notes: this.sortNotes(groups.notes),
			// Filter folders are only worked out when their parent is opened.
			filters: this.sortFolders(
				(this.options.filterFolders ? this.filterGroups(groups.notes, node.namespaces) : []).map((group) =>
					this.createNode('filter', group.tag, group.notes, [...node.namespaces, group.tag], node),
				),
			),
		};
		this.childCache.set(node, children);
		return children;
	}

	private createNode(
		kind: FolderNode['kind'],
		tag: string,
		notes: NoteEntry[],
		namespaces: string[],
		parent: FolderNode | undefined,
	): FolderNode {
		const chain = [tag];
		let groups = this.group(tag, notes);
		while (this.options.compactFolders) {
			const only = groups.folders[0];
			if (groups.folders.length !== 1 || groups.notes.length > 0 || !only) break;
			chain.push(only.tag);
			groups = this.group(only.tag, only.notes);
		}
		const node: FolderNode = {
			kind,
			key: (parent?.key ?? '') + KEY_SEPARATOR + (kind === 'filter' ? '~' : '') + tag,
			chain,
			label: chain.map((t) => this.labelOf(t)).join('/'),
			notes,
			namespaces,
			isTopLevel: parent === undefined,
			parent,
		};
		this.groups.set(node, groups);
		return node;
	}

	private addToIndex(note: NoteEntry, tags: string[]): void {
		for (const tag of tags) {
			let parent = '';
			let end = tag.indexOf('/');
			for (;;) {
				const level = end === -1 ? tag : tag.slice(0, end);
				const list = this.notesUnder.get(level);
				if (list) {
					if (list[list.length - 1] !== note) list.push(note);
				} else {
					// A tag seen for the first time: link it to its parent folder.
					this.notesUnder.set(level, [note]);
					if (parent !== '') {
						const children = this.subfolders.get(parent);
						if (children) children.add(level);
						else this.subfolders.set(parent, new Set([level]));
					}
				}
				if (end === -1) break;
				parent = level;
				end = tag.indexOf('/', end + 1);
			}
			const below = tag + '/';
			if (!tags.some((other) => other.startsWith(below))) addOnce(this.notesDirectlyIn, tag, note);
		}
	}

	/** Splits the notes of `tag` into sub-folders and notes shown directly. */
	private group(tag: string, notes: NoteEntry[]): Groups {
		// Outside filter folders a folder holds exactly the notes under its tag, so the index answers it.
		if (notes === this.notesUnder.get(tag)) {
			return {
				folders: [...(this.subfolders.get(tag) ?? [])].map((child) => ({
					tag: child,
					notes: this.notesUnder.get(child) ?? [],
				})),
				notes: this.notesDirectlyIn.get(tag) ?? [],
			};
		}
		const prefix = tag + '/';
		const folders = new Map<string, NoteEntry[]>();
		const direct: NoteEntry[] = [];

		// Hot path: runs for every note of every folder that is shown, so it avoids allocations.
		for (const note of notes) {
			let inFolder = false;
			for (const noteTag of this.tagsOf(note)) {
				if (!noteTag.startsWith(prefix)) continue;
				const end = noteTag.indexOf('/', prefix.length);
				const child = end === -1 ? noteTag : noteTag.slice(0, end);
				let list = folders.get(child);
				if (!list) folders.set(child, (list = []));
				// A note can reach the same sub-folder through several tags; add it once.
				if (list[list.length - 1] !== note) list.push(note);
				inFolder = true;
			}
			if (!inFolder) direct.push(note);
		}

		return {
			folders: [...folders].map(([child, list]) => ({ tag: child, notes: list })),
			notes: direct,
		};
	}

	/**
	 * Groups `notes` by the namespaces not visited yet. Filters narrow down the notes shown
	 * directly in a folder; sub-folders already split up the rest. A filter is only offered when it
	 * leaves a real choice: it keeps at least two notes, and some tag in it is missing from a note.
	 */
	private filterGroups(notes: NoteEntry[], namespaces: string[]): Group[] {
		if (notes.length < 2) return [];
		const filters = new Map<string, { notes: NoteEntry[]; tagCounts: Map<string, number> }>();
		for (const note of notes) {
			for (const noteTag of this.tagsOf(note)) {
				const namespace = namespaceOf(noteTag);
				if (namespaces.includes(namespace) || this.tags.movedFrom(namespace).length > 0) continue;
				let filter = filters.get(namespace);
				if (!filter) filters.set(namespace, (filter = { notes: [], tagCounts: new Map() }));
				filter.tagCounts.set(noteTag, (filter.tagCounts.get(noteTag) ?? 0) + 1);
				// A note can have several tags in one namespace; count the note once.
				if (filter.notes[filter.notes.length - 1] !== note) filter.notes.push(note);
			}
		}
		return [...filters]
			.filter(([, f]) => f.notes.length > 1 && [...f.tagCounts.values()].some((count) => count < notes.length))
			.map(([namespace, f]) => ({ tag: namespace, notes: f.notes }));
	}

	private tagsOf(note: NoteEntry): string[] {
		return this.tags.lowerTagsOf(note);
	}

	/** The last level of `tag`, spelled as in the first note that has it. */
	private labelOf(tag: string): string {
		let label = this.labels.get(tag);
		if (label === undefined) {
			label = this.spellingOf(tag);
			this.labels.set(tag, label);
		}
		return label;
	}

	private spellingOf(tag: string): string {
		const start = tag.lastIndexOf('/') + 1;
		const note = this.notesUnder.get(tag)?.[0];
		if (note) {
			const lower = this.tags.lowerTagsOf(note);
			const index = lower.findIndex((t) => t === tag || t.startsWith(tag + '/'));
			const written = this.tags.tagsOf(note)[index];
			// Lower-casing can change the length of some characters; then fall back to the lower-case name.
			if (written && written.length === lower[index]?.length) return written.slice(start, tag.length);
		}
		return tag.slice(start);
	}

	/**
	 * Moves the folders ordered by hand to the front, in that order. The sort is stable, so the rest
	 * keep the order the sort put them in. Filter folders always follow the sort order.
	 */
	private orderByHand(folders: FolderNode[]): FolderNode[] {
		const unordered = this.orderRank.size;
		const rank = (node: FolderNode) => this.orderRank.get(node.chain[0] ?? '') ?? unordered;
		return folders.sort((a, b) => rank(a) - rank(b));
	}

	private sortFolders(folders: FolderNode[]): FolderNode[] {
		const compare = compareFolders(this.options.folderSort);
		return folders.sort((a, b) =>
			compare({ label: a.label, count: a.notes.length }, { label: b.label, count: b.notes.length }),
		);
	}

	private sortNotes(notes: NoteEntry[]): NoteEntry[] {
		return [...notes].sort(compareNotes(this.options.noteSort));
	}
}

/** Adds `note` to the list under `key`, unless it was the last one added. */
function addOnce(map: Map<string, NoteEntry[]>, key: string, note: NoteEntry): void {
	const list = map.get(key);
	if (!list) map.set(key, [note]);
	else if (list[list.length - 1] !== note) list.push(note);
}
