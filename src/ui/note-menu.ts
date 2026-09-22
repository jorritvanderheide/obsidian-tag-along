import { type App, Menu, type TFile, type WorkspaceLeaf } from 'obsidian';
import { RenameModal } from './rename-modal';

/**
 * Shows the right-click menu of a note with the same items as the core file explorer. Other
 * plugins and core plugins add their items through the `file-menu` event.
 */
export function showNoteMenu(evt: MouseEvent, app: App, file: TFile, leaf: WorkspaceLeaf): void {
	const menu = new Menu();
	menu.addItem((item) =>
		item
			.setSection('open')
			.setTitle('Open in new tab')
			.setIcon('lucide-file-plus')
			.onClick(() => void app.workspace.getLeaf('tab').openFile(file)),
	);
	menu.addItem((item) =>
		item
			.setSection('open')
			.setTitle('Open to the right')
			.setIcon('lucide-separator-vertical')
			.onClick(() => void app.workspace.getLeaf('split').openFile(file)),
	);
	menu.addItem((item) =>
		item
			.setSection('action')
			.setTitle('Make a copy')
			.setIcon('lucide-files')
			.onClick(() => void makeCopy(app, file)),
	);
	menu.addItem((item) =>
		item
			.setSection('danger')
			.setTitle('Rename...')
			.setIcon('lucide-edit-3')
			.onClick(() => new RenameModal(app, file).open()),
	);
	menu.addItem((item) =>
		item
			.setSection('danger')
			.setTitle('Delete')
			.setIcon('lucide-trash-2')
			.setWarning(true)
			.onClick(() => void app.fileManager.promptForDeletion(file)),
	);
	app.workspace.trigger('file-menu', menu, file, 'file-explorer-context-menu', leaf);
	menu.showAtMouseEvent(evt);
}

/** Shows the right-click menu for several selected notes. */
export function showNotesMenu(evt: MouseEvent, app: App, files: TFile[], leaf: WorkspaceLeaf): void {
	const menu = new Menu();
	menu.addItem((item) =>
		item
			.setSection('danger')
			.setTitle(`Delete ${files.length} notes`)
			.setIcon('lucide-trash-2')
			.setWarning(true)
			.onClick(async () => {
				// Like the core file explorer: Obsidian asks for each note, following the user's settings.
				for (const file of files) {
					if (app.vault.getFileByPath(file.path)) await app.fileManager.promptForDeletion(file);
				}
			}),
	);
	app.workspace.trigger('files-menu', menu, files, 'file-explorer-context-menu', leaf);
	menu.showAtMouseEvent(evt);
}

/** Copies a note next to itself as "Name 1", "Name 2", ... and opens the copy. */
async function makeCopy(app: App, file: TFile): Promise<void> {
	const base = file.path.slice(0, file.path.length - file.extension.length - 1);
	let path = '';
	for (let i = 1; path === '' || app.vault.getAbstractFileByPath(path); i++) path = `${base} ${i}.${file.extension}`;
	const copy = await app.vault.copy(file, path);
	await app.workspace.getLeaf(false).openFile(copy);
}
