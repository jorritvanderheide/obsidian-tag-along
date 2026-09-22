import { setIcon } from 'obsidian';
import type { FocusRow } from '../core/keyboard';
import type { NoteEntry } from '../core/tags';
import { type Children, type FolderNode, isInsideFolder, type TagTree } from '../core/tree';

export interface FolderRow {
	node: FolderNode;
	itemEl: HTMLElement;
	childrenEl: HTMLElement;
	iconEl: HTMLElement;
	depth: number;
}

export interface RenderState {
	isExpanded(key: string): boolean;
	activePath(): string | null;
	isSelected(path: string): boolean;
	showNoteCount(): boolean;
	iconFor(node: FolderNode): string | undefined;
}

/**
 * Draws the tree with the core file explorer's markup and keeps track of the rows it drew, so the
 * view can find them again. Only open folders have their contents drawn.
 */
export class TreeRenderer {
	private readonly folderRows = new Map<string, FolderRow>();
	private readonly noteRows = new Map<string, HTMLElement[]>();
	private readonly rowDepths = new WeakMap<HTMLElement, number>();

	constructor(
		private readonly rootEl: HTMLElement,
		private readonly state: RenderState,
	) {
		rootEl.setAttribute('role', 'tree');
	}

	render(tree: TagTree): void {
		this.folderRows.clear();
		this.noteRows.clear();
		this.rootEl.empty();
		const children = tree.root();
		if (children.folders.length === 0 && children.notes.length === 0) {
			this.rootEl.createDiv({ cls: 'pane-empty', text: 'No tagged notes yet.' });
			return;
		}
		// Top-level items go straight into the root: a `tree-item-children` wrapper would add an
		// extra indent and indentation guide.
		this.renderChildren(tree, children, this.rootEl, 0);
	}

	folderRow(key: string): FolderRow | undefined {
		return this.folderRows.get(key);
	}

	/** Whether any folder that is currently drawn is open. */
	anyFolderOpen(): boolean {
		for (const key of this.folderRows.keys()) {
			if (this.state.isExpanded(key)) return true;
		}
		return false;
	}

	/** Redraws a folder after it was opened or closed. */
	updateFolder(tree: TagTree, row: FolderRow): void {
		const expanded = this.state.isExpanded(row.node.key);
		row.itemEl.toggleClass('is-collapsed', !expanded);
		row.iconEl.toggleClass('is-collapsed', !expanded);
		row.itemEl.querySelector(':scope > .nav-folder-title')?.setAttribute('aria-expanded', String(expanded));
		row.childrenEl.empty();
		this.forgetRemovedRows(row.node.key);
		if (expanded) this.renderChildren(tree, tree.children(row.node), row.childrenEl, row.depth + 1);
	}

	/** All rows in the order they are shown, folders and notes. */
	rowsInOrder(): HTMLElement[] {
		return Array.from(this.rootEl.querySelectorAll<HTMLElement>('.tree-item-self'));
	}

	/** What keyboard navigation needs to know about a row. */
	focusRow(el: HTMLElement): FocusRow {
		const key = el.dataset.key;
		return {
			depth: this.rowDepths.get(el) ?? 0,
			folder: key !== undefined,
			open: key !== undefined && this.state.isExpanded(key),
		};
	}

	/** An id that finds the same row again after a redraw. */
	rowId(el: HTMLElement): string {
		if (el.dataset.key !== undefined) return `folder:${el.dataset.key}`;
		const parent = el.parentElement?.parentElement?.closest('.nav-folder');
		const parentKey = parent?.querySelector<HTMLElement>(':scope > .nav-folder-title')?.dataset.key ?? '';
		return `note:${parentKey}:${el.dataset.path ?? ''}`;
	}

	findRow(id: string): HTMLElement | undefined {
		return this.rowsInOrder().find((el) => this.rowId(el) === id);
	}

	/** Note rows in the order they are shown. */
	noteRowsInOrder(): HTMLElement[] {
		return Array.from(this.rootEl.querySelectorAll<HTMLElement>('.nav-file-title'));
	}

	/** Re-applies the selection highlight to every drawn note. */
	updateSelection(): void {
		for (const [path, rows] of this.noteRows) {
			for (const el of rows) setSelected(el, this.state.isSelected(path));
		}
	}

	setActive(previousPath: string | null, path: string | null): void {
		for (const el of this.noteRows.get(previousPath ?? '') ?? []) el.removeClass('is-active');
		for (const el of this.noteRows.get(path ?? '') ?? []) el.addClass('is-active');
	}

	private renderChildren(tree: TagTree, children: Children, parentEl: HTMLElement, depth: number): void {
		for (const node of children.folders) this.renderFolder(tree, node, parentEl, depth);
		for (const note of children.notes) this.renderNote(note, parentEl, depth);
		for (const node of children.filters) this.renderFolder(tree, node, parentEl, depth);
	}

	private renderFolder(tree: TagTree, node: FolderNode, parentEl: HTMLElement, depth: number): void {
		const expanded = this.state.isExpanded(node.key);
		const itemEl = parentEl.createDiv({ cls: 'tree-item nav-folder' });
		itemEl.toggleClass('is-collapsed', !expanded);

		const selfEl = itemEl.createDiv({
			cls: 'tree-item-self nav-folder-title is-clickable mod-collapsible',
			attr: { 'data-key': node.key, role: 'treeitem', 'aria-expanded': String(expanded) },
		});
		this.setDepth(selfEl, depth);
		// A custom icon takes the place of the collapse arrow. Without `collapse-icon` it is not rotated.
		const icon = this.state.iconFor(node);
		const iconEl = selfEl.createDiv({
			cls: icon ? 'tree-item-icon tag-explorer-folder-icon' : 'tree-item-icon collapse-icon',
		});
		iconEl.toggleClass('is-collapsed', !expanded);
		setIcon(iconEl, icon || 'right-triangle');
		// Every folder starts with a capital; the rest keeps its spelling, so `domain/app` shows as "Domain/app".
		const label = capitalize(node.label);
		selfEl.createDiv({ cls: 'tree-item-inner nav-folder-title-content', text: label });
		if (this.state.showNoteCount()) {
			selfEl.createDiv({ cls: 'tree-item-flair-outer' }).createSpan({
				cls: 'tree-item-flair',
				text: String(node.notes.length),
			});
		}
		if (node.kind === 'filter') {
			selfEl.addClass('tag-explorer-filter');
			selfEl.setAttribute('aria-label', `Narrow down by ${label}`);
		} else {
			// Tag folders can be dragged to change their order among their siblings.
			selfEl.setAttribute('draggable', 'true');
		}

		const childrenEl = itemEl.createDiv({ cls: 'tree-item-children nav-folder-children' });
		this.folderRows.set(node.key, { node, itemEl, childrenEl, iconEl, depth });
		if (expanded) this.renderChildren(tree, tree.children(node), childrenEl, depth + 1);
	}

	private renderNote(note: NoteEntry, parentEl: HTMLElement, depth: number): void {
		const itemEl = parentEl.createDiv({ cls: 'tree-item nav-file' });
		const selfEl = itemEl.createDiv({
			cls: 'tree-item-self nav-file-title is-clickable tappable',
			attr: { 'data-path': note.path, role: 'treeitem' },
		});
		this.setDepth(selfEl, depth);
		selfEl.toggleClass('is-active', note.path === this.state.activePath());
		setSelected(selfEl, this.state.isSelected(note.path));
		selfEl.createDiv({ cls: 'tree-item-inner nav-file-title-content', text: note.name });

		const rows = this.noteRows.get(note.path);
		if (rows) rows.push(selfEl);
		else this.noteRows.set(note.path, [selfEl]);
	}

	/** Lets styles.css stretch the row highlight to the full width, like the core file explorer. */
	private setDepth(rowEl: HTMLElement, depth: number): void {
		this.rowDepths.set(rowEl, depth);
		if (depth > 0) rowEl.setCssProps({ '--tag-explorer-depth': String(depth) });
	}

	/** Drops lookups for rows that were inside a folder that just closed. */
	private forgetRemovedRows(folderKey: string): void {
		for (const key of this.folderRows.keys()) {
			if (isInsideFolder(key, folderKey)) this.folderRows.delete(key);
		}
		for (const [path, rows] of this.noteRows) {
			const kept = rows.filter((el) => el.isConnected);
			if (kept.length === 0) this.noteRows.delete(path);
			else if (kept.length !== rows.length) this.noteRows.set(path, kept);
		}
	}
}

function capitalize(label: string): string {
	return label.charAt(0).toLocaleUpperCase() + label.slice(1);
}

function setSelected(rowEl: HTMLElement, selected: boolean): void {
	rowEl.toggleClass('is-selected', selected);
	rowEl.setAttribute('aria-selected', String(selected));
}
