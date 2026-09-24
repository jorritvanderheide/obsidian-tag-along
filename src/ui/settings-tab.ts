import {
	type App,
	PluginSettingTab,
	type SettingDefinitionAddItem,
	type SettingDefinitionItem,
	type SettingDefinitionList,
	type TFolder,
} from 'obsidian';
import type TagExplorerPlugin from '../main';
import { ChoiceModal } from './choice-modal';

type FolderListKey = 'includedFolders' | 'excludedFolders';
type TagListKey = 'hiddenFolders' | 'topLevelFolders' | 'flatFolders' | 'folderOrder' | 'folderOrderEnd' | 'excludedTags';
type ListKey = TagListKey | FolderListKey;

export class TagExplorerSettingTab extends PluginSettingTab {
	icon = 'tags';

	constructor(
		app: App,
		private readonly plugin: TagExplorerPlugin,
	) {
		super(app, plugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		// Obsidian keeps these definitions from when the plugin loaded, so everything that can change
		// (tags in the vault, counts) is read when it is shown or clicked.
		const settings = () => this.plugin.settings;
		const allTags = () => this.plugin.index.allTags();
		const topLevelNames = () => settings().topLevelFolders.map((tag) => tag.slice(tag.lastIndexOf('/') + 1));
		return [
			{
				type: 'group',
				heading: 'Folders',
				items: [
					{
						name: 'Compact folders',
						desc: 'Show a folder and its only sub-folder as one entry, like "project/website", when the folder has no notes of its own.',
						control: { type: 'toggle', key: 'compactFolders' },
					},
					{
						name: 'Filter folders',
						desc: 'Inside a folder, show your other tag namespaces as grayed-out folders below the notes. Open one to narrow the folder\'s notes down by that namespace.',
						control: { type: 'toggle', key: 'filterFolders' },
					},
					{
						type: 'page',
						name: 'Folder order',
						desc: 'Folders you dragged into place in the tree, and folders pinned to the bottom of the pane. Every other folder follows the sort order, in between the two. Remove a folder here, or right-click it and choose "Follow sort order", to let it follow the sort order again.',
						displayValue: () =>
							countLabel(settings().folderOrder.length + settings().folderOrderEnd.length, 'folder', 'folders'),
						items: [
							{
								...this.list(
									'folderOrder',
									settings().folderOrder.map((tag) => `#${tag}`),
									'No folders put in order. Drag a folder in the tree to change where it appears.',
								),
								heading: 'Shown first',
							},
							{
								...this.list(
									'folderOrderEnd',
									settings().folderOrderEnd.map((tag) => `#${tag}`),
									'No folders pinned. Drag a folder below all the others, or right-click it and choose "Pin to bottom".',
								),
								heading: 'Pinned to the bottom',
							},
						],
					},
					{
						type: 'page',
						name: 'Top-level folders',
						desc: 'These sub-tags move out of their parent and get a folder of their own at the top of the tree, merged with a folder of the same name. They are not offered as filter folders. You can also right-click a folder and choose "Move to top level".',
						displayValue: () => countLabel(settings().topLevelFolders.length, 'folder', 'folders'),
						items: [
							this.tagList(
								'topLevelFolders',
								() => allTags().filter((tag) => tag.includes('/')),
								'Add a folder',
								'Choose a sub-tag to move...',
								'No folders moved to the top level.',
							),
						],
					},
					{
						type: 'page',
						name: 'Flat folders',
						desc: 'These folders list every note below them, from their sub-tags too, instead of showing sub-folders. You can also right-click a folder and choose "Flatten folder".',
						displayValue: () => countLabel(settings().flatFolders.length, 'folder', 'folders'),
						items: [
							this.tagList(
								'flatFolders',
								() => withSubTags(allTags()),
								'Flatten a folder',
								'Choose a folder to flatten...',
								'No flat folders.',
							),
						],
					},
					{
						type: 'page',
						name: 'Hidden folders',
						desc: 'These tags and their sub-tags get no folder, and are not offered as filter folders. Their notes still appear under their other tags; notes without any other tags count as untagged. Folders moved to the top level stay visible, even when the tag they came from is hidden. You can also right-click a folder and choose "Hide folder".',
						displayValue: () => countLabel(settings().hiddenFolders.length, 'folder', 'folders'),
						items: [
							this.tagList(
								'hiddenFolders',
								() => [...new Set([...allTags(), ...topLevelNames()])].sort(),
								'Hide a folder',
								'Choose a tag to hide...',
								'No hidden folders.',
							),
						],
					},
					{
						name: 'Show untagged notes',
						desc: 'List notes without any tags at the top of the tree.',
						control: { type: 'toggle', key: 'showUntagged' },
					},
				],
			},
			{
				type: 'group',
				heading: 'Notes',
				items: [
					{
						name: 'Show note titles',
						desc: 'Show the "title" property or the first heading of a note instead of its file name.',
						control: { type: 'toggle', key: 'showNoteTitles' },
					},
					{
						name: 'Show note counts',
						desc: 'Show how many notes are in each folder.',
						control: { type: 'toggle', key: 'showNoteCount' },
					},
					{
						name: 'Open tags in Tag Explorer',
						desc: 'Clicking a tag in a note opens its folder here instead of searching for it. Hold Ctrl/Cmd while clicking to search as usual.',
						control: { type: 'toggle', key: 'openTagsInExplorer' },
					},
				],
			},
			{
				type: 'group',
				heading: 'Which notes to show',
				items: [
					{
						type: 'page',
						name: 'Included folders',
						desc: 'Only notes inside these folders, including their sub-folders, appear in the tree. Leave empty to use the whole vault.',
						displayValue: () =>
							settings().includedFolders.length === 0
								? 'Whole vault'
								: countLabel(settings().includedFolders.length, 'folder', 'folders'),
						items: [this.folderList('includedFolders', 'Include a folder', 'No included folders: the whole vault is used.')],
					},
					{
						type: 'page',
						name: 'Excluded folders',
						desc: 'Notes inside these folders, including their sub-folders, are left out, even when they are inside an included folder.',
						displayValue: () => countLabel(settings().excludedFolders.length, 'folder', 'folders'),
						items: [this.folderList('excludedFolders', 'Exclude a folder', 'No excluded folders.')],
					},
					{
						type: 'page',
						name: 'Excluded tags',
						desc: 'Notes with any of these tags are left out of the tree. Sub-tags count too: excluding "archive" also leaves out notes tagged "archive/2024".',
						displayValue: () => countLabel(settings().excludedTags.length, 'tag', 'tags'),
						items: [
							this.tagList(
								'excludedTags',
								allTags,
								'Exclude a tag',
								'Choose a tag to exclude...',
								'No excluded tags.',
							),
						],
					},
				],
			},
		];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		await this.plugin.updateSettings({ [key]: value });
	}

	private list(key: ListKey, names: string[], emptyState: string, addItem?: SettingDefinitionAddItem): SettingDefinitionList {
		return {
			type: 'list',
			emptyState,
			addItem,
			onDelete: (index) => {
				void this.plugin.updateSettings((s) => ({ [key]: s[key].filter((_, i) => i !== index) }));
			},
			items: names.map((name) => ({ name })),
		};
	}

	private tagList(
		key: TagListKey,
		choices: () => string[],
		addLabel: string,
		placeholder: string,
		emptyState: string,
	): SettingDefinitionList {
		const action = () =>
			this.pick(
				choices().filter((tag) => !this.plugin.settings[key].includes(tag)),
				(tag) => `#${tag}`,
				placeholder,
				(tag) => this.addTo(key, tag),
			);
		return this.list(
			key,
			this.plugin.settings[key].map((tag) => `#${tag}`),
			emptyState,
			{ name: addLabel, action },
		);
	}

	private folderList(key: FolderListKey, addLabel: string, emptyState: string): SettingDefinitionList {
		const action = () =>
			this.pick(
				this.app.vault.getAllFolders(false).filter((folder) => !this.plugin.settings[key].includes(folder.path)),
				(folder: TFolder) => folder.path,
				'Choose a folder...',
				(folder) => this.addTo(key, folder.path),
			);
		return this.list(key, this.plugin.settings[key], emptyState, { name: addLabel, action });
	}

	private pick<T>(items: T[], textOf: (item: T) => string, placeholder: string, onChoose: (item: T) => void): void {
		new ChoiceModal(this.app, items, textOf, placeholder, onChoose).open();
	}

	private addTo(key: ListKey, value: string): void {
		void this.plugin.updateSettings((s) => ({ [key]: [...s[key], value] }));
	}
}

/** The tags that have sub-tags: only those have sub-folders to flatten. */
function withSubTags(tags: string[]): string[] {
	const parents = new Set(tags.filter((tag) => tag.includes('/')).map((tag) => tag.slice(0, tag.lastIndexOf('/'))));
	return tags.filter((tag) => parents.has(tag));
}

function countLabel(count: number, singular: string, plural: string): string {
	if (count === 0) return 'None';
	return `${count} ${count === 1 ? singular : plural}`;
}
