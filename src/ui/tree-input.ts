import { type App, Keymap, type Scope, type TFile } from 'obsidian';
import { type FocusKey, moveFocus } from '../core/keyboard';
import { rangeBetween } from '../core/select';
import { RenameModal } from './rename-modal';
import type { FolderRow, TreeRenderer } from './tree-renderer';

export interface TreeInputHost {
	readonly app: App;
	renderer(): TreeRenderer;
	toggleFolder(row: FolderRow): void;
}

/** Clicks, selection and keyboard focus in the tree, handled like the core file explorer. */
export class TreeInput {
	/** Selected notes by path: Alt-click toggles one, Shift-click selects a range. */
	private readonly selected = new Set<string>();
	/** The row that the next Shift-click selects from. */
	private anchorEl: HTMLElement | null = null;
	/** The row with keyboard focus, and an id to find it again after a redraw. */
	private focusedEl: HTMLElement | null = null;
	private focusedId: string | null = null;

	constructor(private readonly host: TreeInputHost) {}

	isSelected(path: string): boolean {
		return this.selected.has(path);
	}

	/** The selected notes, when `path` is one of several selected notes. */
	selectionFor(path: string): TFile[] | undefined {
		if (this.selected.size < 2 || !this.selected.has(path)) return undefined;
		return [...this.selected]
			.map((selected) => this.host.app.vault.getFileByPath(selected))
			.filter((file): file is TFile => file !== null);
	}

	/** Drops notes from the selection that no longer exist. */
	forgetMissing(): void {
		for (const path of this.selected) {
			if (!this.host.app.vault.getFileByPath(path)) this.selected.delete(path);
		}
	}

	/** Restores the focus highlight after the tree was redrawn. */
	afterRender(): void {
		this.focusedRow()?.addClass('has-focus');
	}

	onFolderClick(row: FolderRow): void {
		this.clearSelection();
		this.setFocus(row.selfEl);
		this.host.toggleFolder(row);
	}

	onNoteClick(evt: MouseEvent, el: HTMLElement, file: TFile): void {
		this.setFocus(el);
		if (!Keymap.isModEvent(evt) && (evt.altKey || evt.shiftKey)) {
			this.select(el, file.path, evt.shiftKey);
			return;
		}
		this.clearSelection();
		this.anchorEl = el;
		void this.host.app.workspace.getLeaf(Keymap.isModEvent(evt)).openFile(file);
	}

	clearSelection(): void {
		if (this.selected.size === 0) return;
		this.selected.clear();
		this.host.renderer().updateSelection();
	}

	setFocus(el: HTMLElement | undefined): void {
		this.focusedRow()?.removeClass('has-focus');
		this.focusedEl = el ?? null;
		this.focusedId = el ? this.host.renderer().rowId(el) : null;
		if (!el) return;
		el.addClass('has-focus');
		el.scrollIntoView({ block: 'nearest' });
	}

	/** Keys while the view has focus. Handlers return false to stop the key from doing anything else. */
	registerKeys(scope: Scope): void {
		const arrows: [string, FocusKey][] = [
			['ArrowUp', 'up'],
			['ArrowDown', 'down'],
			['ArrowLeft', 'left'],
			['ArrowRight', 'right'],
		];
		for (const [key, direction] of arrows) {
			scope.register([], key, () => {
				this.moveFocus(direction);
				return false;
			});
		}
		const open = (evt: KeyboardEvent) => {
			this.openFocused(evt);
			return false;
		};
		scope.register([], 'Enter', open);
		scope.register(['Mod'], 'Enter', open);
		scope.register([], 'F2', () => {
			const file = this.focusedFile();
			if (file) new RenameModal(this.host.app, file).open();
			return false;
		});
		const remove = () => {
			void this.deleteFocused();
			return false;
		};
		scope.register([], 'Delete', remove);
		scope.register([], 'Backspace', remove);
		scope.register([], 'Escape', () => {
			if (this.selected.size === 0) return true;
			this.clearSelection();
			return false;
		});
	}

	private select(el: HTMLElement, path: string, range: boolean): void {
		if (range) {
			const from = this.anchorEl?.isConnected ? this.anchorEl : undefined;
			for (const row of rangeBetween(this.host.renderer().noteRowsInOrder(), from, el)) {
				if (row.dataset.path) this.selected.add(row.dataset.path);
			}
		} else {
			if (this.selected.has(path)) this.selected.delete(path);
			else this.selected.add(path);
			this.anchorEl = el;
		}
		this.host.renderer().updateSelection();
	}

	private moveFocus(direction: FocusKey): void {
		const renderer = this.host.renderer();
		const rows = renderer.rowsInOrder();
		const current = this.focusedRow();
		const move = moveFocus(
			rows.map((el) => renderer.focusRow(el)),
			current ? rows.indexOf(current) : -1,
			direction,
		);
		const target = rows[move.index];
		const row = move.toggle && target?.dataset.key !== undefined ? renderer.folderRow(target.dataset.key) : undefined;
		if (row) this.host.toggleFolder(row);
		else this.setFocus(target);
	}

	private openFocused(evt: KeyboardEvent): void {
		const key = this.focusedRow()?.dataset.key;
		const row = key !== undefined ? this.host.renderer().folderRow(key) : undefined;
		if (row) {
			this.host.toggleFolder(row);
			return;
		}
		const file = this.focusedFile();
		if (file) void this.host.app.workspace.getLeaf(Keymap.isModEvent(evt)).openFile(file);
	}

	/** Deletes the focused note, or all selected notes when the focused note is one of them. */
	private async deleteFocused(): Promise<void> {
		const file = this.focusedFile();
		if (!file) return;
		const paths = this.selected.has(file.path) ? [...this.selected] : [file.path];
		for (const path of paths) {
			const target = this.host.app.vault.getFileByPath(path);
			if (target) await this.host.app.fileManager.promptForDeletion(target);
		}
	}

	private focusedRow(): HTMLElement | undefined {
		if (this.focusedEl?.isConnected) return this.focusedEl;
		// The row was redrawn: find its replacement.
		this.focusedEl = this.focusedId === null ? null : (this.host.renderer().findRow(this.focusedId) ?? null);
		return this.focusedEl ?? undefined;
	}

	private focusedFile(): TFile | null {
		const path = this.focusedRow()?.dataset.path;
		return path ? this.host.app.vault.getFileByPath(path) : null;
	}
}
