import {
	type HoverParent,
	type HoverPopover,
	ItemView,
	Scope,
	setIcon,
	type TFile,
	type ViewStateResult,
	type WorkspaceLeaf,
} from 'obsidian';
import { reorderFolders } from '../core/reorder';
import type { FolderNode, TagTree } from '../core/tree';
import type TagExplorerPlugin from '../main';
import { folderIcon, showFolderMenu } from './folder-menu';
import { showNoteMenu, showNotesMenu } from './note-menu';
import { showSortMenu } from './sort-menu';
import { TreeDrag } from './tree-drag';
import { TreeInput } from './tree-input';
import { type FolderRow, TreeRenderer } from './tree-renderer';

export const VIEW_TYPE = 'tag-explorer-view';

export class TagExplorerView extends ItemView implements HoverParent {
	hoverPopover: HoverPopover | null = null;
	navigation = false;

	private opened = false;
	private tree: TagTree | null = null;
	private expanded = new Set<string>();
	private activePath: string | null = null;
	private readonly input = new TreeInput({
		app: this.app,
		renderer: () => this.renderer,
		toggleFolder: (row) => this.toggleFolder(row),
	});
	private readonly drag = new TreeDrag({
		renderer: () => this.renderer,
		siblings: (node) => this.siblings(node),
		reorder: (dragged, target, before) => this.reorder(dragged, target, before),
	});

	private scrollEl!: HTMLElement;
	private renderer!: TreeRenderer;
	private compactButton!: HTMLElement;
	private filterButton!: HTMLElement;
	private expandButton!: HTMLElement;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: TagExplorerPlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Tag Explorer';
	}

	getIcon(): string {
		return 'tags';
	}

	protected async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.buildToolbar(this.contentEl.createDiv({ cls: 'nav-header' }));
		this.scrollEl = this.contentEl.createDiv({ cls: 'nav-files-container' });
		this.renderer = new TreeRenderer(this.scrollEl.createDiv(), {
			isExpanded: (key) => this.expanded.has(key),
			activePath: () => this.activePath,
			isSelected: (path) => this.input.isSelected(path),
			showNoteCount: () => this.plugin.settings.showNoteCount,
			iconFor: (node) => (this.tree ? folderIcon(this.plugin.settings.folderIcons, this.tree, node) : undefined),
		});

		this.registerDomEvent(this.scrollEl, 'click', (evt) => this.onClick(evt));
		this.registerDomEvent(this.scrollEl, 'auxclick', (evt) => {
			if (evt.button === 1) this.onClick(evt);
		});
		this.registerDomEvent(this.scrollEl, 'mouseover', (evt) => this.onHover(evt));
		this.registerDomEvent(this.scrollEl, 'dragstart', (evt) => this.drag.onDragStart(evt));
		this.registerDomEvent(this.scrollEl, 'dragover', (evt) => this.drag.onDragOver(evt));
		this.registerDomEvent(this.scrollEl, 'drop', (evt) => this.drag.onDrop(evt));
		this.registerDomEvent(this.scrollEl, 'dragend', () => this.drag.onDragEnd());
		this.registerDomEvent(this.scrollEl, 'dragleave', (evt) => {
			// Leaving a row for the next one redraws the line; leaving the pane takes it away.
			if (!this.scrollEl.contains(evt.relatedTarget as Node | null)) this.drag.clearIndicator();
		});
		this.registerDomEvent(this.scrollEl, 'contextmenu', (evt) => this.onContextMenu(evt));
		this.registerEvent(this.app.workspace.on('file-open', (file) => this.setActiveFile(file)));
		this.scope = new Scope(this.app.scope);
		this.input.registerKeys(this.scope);

		this.activePath = this.app.workspace.getActiveFile()?.path ?? null;
		this.opened = true;
		this.refresh();
		return Promise.resolve();
	}

	getState(): Record<string, unknown> {
		return { ...super.getState(), expanded: [...this.expanded] };
	}

	async setState(state: unknown, result: ViewStateResult): Promise<void> {
		const expanded = (state as { expanded?: unknown } | null)?.expanded;
		if (Array.isArray(expanded)) {
			this.expanded = new Set(expanded.filter((key): key is string => typeof key === 'string'));
			this.render();
		}
		await super.setState(state, result);
	}

	/** Picks up the current tree (shared by all views) and redraws. */
	refresh(): void {
		if (!this.opened) return;
		const { settings } = this.plugin;
		this.tree = this.plugin.tree();
		this.input.forgetMissing();
		this.compactButton.toggleClass('is-active', settings.compactFolders);
		this.filterButton.toggleClass('is-active', settings.filterFolders);
		this.render();
	}

	/** Collapses everything when any folder is open, otherwise opens all tag folders. */
	toggleAll(): void {
		if (this.renderer.anyFolderOpen()) this.collapseAll();
		else this.expandAll();
	}

	collapseAll(): void {
		this.expanded.clear();
		this.render();
		this.app.workspace.requestSaveLayout();
	}

	/** Opens every tag folder. Filter folders stay closed, as opening them would multiply the tree. */
	expandAll(): void {
		const tree = this.tree;
		if (!tree) return;
		const expand = (folders: FolderNode[]) => {
			for (const node of folders) {
				this.expanded.add(node.key);
				expand(tree.children(node).folders);
			}
		};
		expand(tree.root().folders);
		this.render();
		this.app.workspace.requestSaveLayout();
	}

	/** Opens the folders down to a note, scrolls to it and flashes it. Returns false when it is not shown. */
	revealNote(path: string): boolean {
		const folder = this.openPath(this.tree?.pathToNote(path));
		const row = folder && this.renderer.folderRow(folder.key);
		const noteEl = Array.from(row?.childrenEl.children ?? [])
			.map((child) => child.querySelector<HTMLElement>(':scope > .nav-file-title'))
			.find((el) => el?.dataset.path === path);
		if (!noteEl) return false;
		this.input.setFocus(noteEl);
		flash(noteEl);
		return true;
	}

	/** Opens the folder of a tag and the folders above it, scrolls to it and flashes it. */
	revealTag(tag: string): boolean {
		const folder = this.openPath(this.tree?.pathToTag(tag));
		const row = folder && this.renderer.folderRow(folder.key);
		const folderEl = row?.itemEl.querySelector<HTMLElement>(':scope > .nav-folder-title');
		if (!folderEl) return false;
		this.input.setFocus(folderEl);
		flash(folderEl);
		return true;
	}

	private openPath(folders: FolderNode[] | undefined): FolderNode | undefined {
		if (!folders?.length) return undefined;
		for (const folder of folders) this.expanded.add(folder.key);
		this.render();
		this.app.workspace.requestSaveLayout();
		return folders[folders.length - 1];
	}

	/** The folders at the level of `node`, in the order they are shown. */
	private siblings(node: FolderNode): FolderNode[] {
		if (!this.tree) return [];
		return (node.parent ? this.tree.children(node.parent) : this.tree.root()).folders;
	}

	/** Writes down the order of a folder's level after one of its folders was dragged. */
	private reorder(dragged: FolderNode, target: FolderNode, before: boolean): void {
		const siblings = this.siblings(dragged).map((node) => node.chain[0] ?? '');
		void this.plugin.updateSettings((s) => ({
			folderOrder: reorderFolders(s.folderOrder, siblings, dragged.chain[0] ?? '', target.chain[0] ?? '', before),
		}));
	}

	private toggleFolder(row: FolderRow): void {
		if (!this.tree) return;
		const { key } = row.node;
		if (this.expanded.has(key)) this.expanded.delete(key);
		else this.expanded.add(key);
		this.renderer.updateFolder(this.tree, row);
		this.updateExpandButton();
		this.app.workspace.requestSaveLayout();
	}

	private buildToolbar(headerEl: HTMLElement): void {
		const buttonsEl = headerEl.createDiv({ cls: 'nav-buttons-container' });
		const button = (icon: string, label: string, onClick: (evt: MouseEvent) => void) => {
			const el = buttonsEl.createDiv({ cls: 'clickable-icon nav-action-button', attr: { 'aria-label': label } });
			setIcon(el, icon);
			this.registerDomEvent(el, 'click', onClick);
			return el;
		};
		button('lucide-sort-asc', 'Change sort order', (evt) => showSortMenu(evt, this.plugin));
		this.compactButton = button('folder-minus', 'Compact folders', () => {
			void this.plugin.updateSettings((s) => ({ compactFolders: !s.compactFolders }));
		});
		this.filterButton = button('filter', 'Filter folders', () => {
			void this.plugin.updateSettings((s) => ({ filterFolders: !s.filterFolders }));
		});
		this.expandButton = button('chevrons-down-up', 'Collapse all', () => this.toggleAll());
	}

	private updateExpandButton(): void {
		const collapse = this.renderer.anyFolderOpen();
		setIcon(this.expandButton, collapse ? 'chevrons-down-up' : 'chevrons-up-down');
		this.expandButton.setAttribute('aria-label', collapse ? 'Collapse all' : 'Expand all');
	}

	private render(): void {
		if (!this.tree) return;
		const scrollTop = this.scrollEl.scrollTop;
		this.renderer.render(this.tree);
		this.input.afterRender();
		this.scrollEl.scrollTop = scrollTop;
		this.updateExpandButton();
	}

	private onClick(evt: MouseEvent): void {
		const target = evt.target as HTMLElement;
		const folderEl = target.closest<HTMLElement>('.nav-folder-title');
		const row = folderEl?.dataset.key !== undefined ? this.renderer.folderRow(folderEl.dataset.key) : undefined;
		if (folderEl && row) {
			this.input.onFolderClick(folderEl, row);
			return;
		}
		const noteEl = target.closest<HTMLElement>('.nav-file-title');
		const path = noteEl?.dataset.path;
		const file = path ? this.app.vault.getFileByPath(path) : null;
		if (!noteEl || !file) return;
		evt.preventDefault();
		this.input.onNoteClick(evt, noteEl, file);
	}

	private onContextMenu(evt: MouseEvent): void {
		const target = evt.target as HTMLElement;
		const path = target.closest<HTMLElement>('.nav-file-title')?.dataset.path;
		const file = path ? this.app.vault.getFileByPath(path) : null;
		if (file) {
			evt.preventDefault();
			const selection = this.input.selectionFor(file.path);
			if (selection) {
				showNotesMenu(evt, this.app, selection, this.leaf);
			} else {
				this.input.clearSelection();
				showNoteMenu(evt, this.app, file, this.leaf);
			}
			return;
		}
		const key = target.closest<HTMLElement>('.nav-folder-title')?.dataset.key;
		const row = key !== undefined ? this.renderer.folderRow(key) : undefined;
		if (!row || !this.tree) return;
		// Filter folders have no menu of their own, but should not show a default one either.
		evt.preventDefault();
		if (row.node.kind === 'folder') showFolderMenu(evt, this.plugin, this.tree, row.node);
	}

	private onHover(evt: MouseEvent): void {
		const targetEl = (evt.target as HTMLElement).closest<HTMLElement>('.nav-file-title');
		const path = targetEl?.dataset.path;
		if (!targetEl || !path || targetEl.contains(evt.relatedTarget as Node | null)) return;
		this.app.workspace.trigger('hover-link', {
			event: evt,
			source: VIEW_TYPE,
			hoverParent: this,
			targetEl,
			linktext: path,
		});
	}

	private setActiveFile(file: TFile | null): void {
		const previous = this.activePath;
		this.activePath = file?.path ?? null;
		this.renderer.setActive(previous, this.activePath);
	}
}

/** Scrolls a row into view and flashes it, like the core file explorer does when revealing a file. */
function flash(el: HTMLElement): void {
	el.scrollIntoView({ block: 'center' });
	el.addClass('is-flashing');
	window.setTimeout(() => el.removeClass('is-flashing'), 750);
}
