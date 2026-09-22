import { Menu } from 'obsidian';
import type { FolderSort, NoteSort } from '../core/sort';
import type { PluginHost } from '../host';

const NOTE_SORT_LABELS: Record<NoteSort, string> = {
	'name-asc': 'Name (A to Z)',
	'name-desc': 'Name (Z to A)',
	'modified-desc': 'Modified time (new to old)',
	'modified-asc': 'Modified time (old to new)',
	'created-desc': 'Created time (new to old)',
	'created-asc': 'Created time (old to new)',
};

const FOLDER_SORT_LABELS: Record<FolderSort, string> = {
	'name-asc': 'Name (A to Z)',
	'name-desc': 'Name (Z to A)',
	'count-desc': 'Most notes first',
	'count-asc': 'Fewest notes first',
};

/** The toolbar's sort menu: one choice for notes and one for folders. */
export function showSortMenu(evt: MouseEvent, plugin: PluginHost): void {
	const { noteSort, folderSort } = plugin.settings;
	const menu = new Menu();
	menu.addItem((item) => item.setSection('notes').setTitle('Notes').setIsLabel(true));
	for (const [sort, title] of Object.entries(NOTE_SORT_LABELS) as [NoteSort, string][]) {
		menu.addItem((item) =>
			item
				.setSection('notes')
				.setTitle(title)
				.setChecked(sort === noteSort)
				.onClick(() => void plugin.updateSettings({ noteSort: sort })),
		);
	}
	menu.addItem((item) => item.setSection('folders').setTitle('Folders').setIsLabel(true));
	for (const [sort, title] of Object.entries(FOLDER_SORT_LABELS) as [FolderSort, string][]) {
		menu.addItem((item) =>
			item
				.setSection('folders')
				.setTitle(title)
				.setChecked(sort === folderSort)
				.onClick(() => void plugin.updateSettings({ folderSort: sort })),
		);
	}
	menu.showAtMouseEvent(evt);
}
