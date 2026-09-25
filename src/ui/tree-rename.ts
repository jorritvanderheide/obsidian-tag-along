import { type App, Scope, type TFile } from 'obsidian';
import { renameNote } from '../rename';

interface Editing {
	rowEl: HTMLElement;
	titleEl: HTMLElement;
	file: TFile;
	title: string;
	scope: Scope;
}

/**
 * Renames a note in place, like the core file explorer: the name in its row becomes editable. Enter
 * or clicking elsewhere saves, Escape cancels.
 */
export class TreeRename {
	private editing: Editing | null = null;

	constructor(
		private readonly app: App,
		private readonly onEnd: () => void,
	) {}

	/** True while a name is being edited. Redrawing the tree then would throw the edit away. */
	isActive(): boolean {
		return this.editing !== null;
	}

	/** Whether an event happened in the name being edited. */
	contains(target: EventTarget | null): boolean {
		return this.editing?.titleEl.contains(target as Node | null) ?? false;
	}

	start(rowEl: HTMLElement, file: TFile): void {
		this.finish(true);
		const titleEl = rowEl.querySelector<HTMLElement>('.tree-item-inner');
		if (!titleEl) return;
		// Keys go to this scope first, so the tree's own keys (arrows, Delete) do not act on the row.
		const scope = new Scope(this.app.scope);
		scope.register([], 'Enter', (evt) => {
			if (evt.isComposing) return true;
			this.finish(true);
			return false;
		});
		scope.register([], 'Escape', () => {
			this.finish(false);
			return false;
		});
		this.editing = { rowEl, titleEl, file, title: titleEl.getText(), scope };
		rowEl.addClass('is-being-renamed');
		titleEl.setAttribute('contenteditable', 'true');
		titleEl.addEventListener('blur', () => this.finish(true), { once: true });
		this.app.keymap.pushScope(scope);
		selectAll(titleEl);
	}

	private finish(save: boolean): void {
		const editing = this.editing;
		if (!editing) return;
		this.editing = null;
		const { rowEl, titleEl, file, title, scope } = editing;
		this.app.keymap.popScope(scope);
		rowEl.removeClass('is-being-renamed');
		titleEl.removeAttribute('contenteditable');
		const newTitle = titleEl.getText().replace(/\s+/g, ' ').trim();
		const rename = save && newTitle !== '' && newTitle !== title;
		// Show the new title right away; the tree catches up once Obsidian has read the note again.
		titleEl.setText(rename ? newTitle : title);
		if (rename) void renameNote(this.app, file, title, newTitle);
		this.onEnd();
	}
}

function selectAll(el: HTMLElement): void {
	const range = el.doc.createRange();
	range.selectNodeContents(el);
	const selection = el.win.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
	el.focus({ preventScroll: true });
}
