import { debounce, Notice, Plugin, TFile, TFolder } from 'obsidian';
import { LastResult } from './core/cache';
import { fixFolderCase, renameFolderPaths } from './core/paths';
import type { PluginHost } from './host';
import { TagTree } from './core/tree';
import { NoteIndex } from './note-index';
import {
	applySettingsChange,
	DEFAULT_SETTINGS,
	migrateSettings,
	type SettingsChange,
	type TagAlongSettings,
} from './settings';
import { TagAlongSettingTab } from './ui/settings-tab';
import { registerTagClicks } from './tag-clicks';
import { TagAlongView, VIEW_TYPE } from './ui/view';

export default class TagAlongPlugin extends Plugin implements PluginHost {
	settings: TagAlongSettings = DEFAULT_SETTINGS;
	readonly index = new NoteIndex(this.app, () => this.settings);
	/** One tree for all open views, rebuilt only when the notes or settings changed. */
	private readonly trees = new LastResult(
		(_version: number, settings: TagAlongSettings) => new TagTree(this.index.visibleNotes(), settings),
	);
	private settingTab!: TagAlongSettingTab;

	tree(): TagTree {
		return this.trees.get(this.index.version, this.settings);
	}

	private readonly refreshViews = debounce(
		() => {
			for (const view of this.views()) view.refresh();
		},
		100,
		true,
	);

	async onload(): Promise<void> {
		const data: unknown = await this.loadData();
		this.settings = migrateSettings(data);

		this.registerView(VIEW_TYPE, (leaf) => new TagAlongView(leaf, this));
		this.registerHoverLinkSource(VIEW_TYPE, { display: 'Tag Along', defaultMod: true });
		this.addRibbonIcon('tags', 'Open Tag Along', () => void this.openView());
		this.settingTab = new TagAlongSettingTab(this.app, this);
		this.addSettingTab(this.settingTab);

		this.addCommand({
			id: 'open',
			name: 'Open',
			callback: () => void this.openView(),
		});
		this.addCommand({
			id: 'reveal-active-note',
			name: 'Reveal active note',
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file || !this.tree().pathToNote(file.path)) return false;
				if (!checking) void this.revealNote(file.path);
				return true;
			},
		});
		this.addCommand({
			id: 'expand-all',
			name: 'Expand all folders',
			checkCallback: (checking) => this.withViews(checking, (view) => view.expandAll()),
		});
		this.addCommand({
			id: 'collapse-all',
			name: 'Collapse all folders',
			checkCallback: (checking) => this.withViews(checking, (view) => view.collapseAll()),
		});
		this.addCommand({
			id: 'toggle-compact-folders',
			name: 'Toggle compact folders',
			callback: () => void this.updateSettings((s) => ({ compactFolders: !s.compactFolders })),
		});
		this.addCommand({
			id: 'toggle-filter-folders',
			name: 'Toggle filter folders',
			callback: () => void this.updateSettings((s) => ({ filterFolders: !s.filterFolders })),
		});

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file, _source, leaf) => {
				if (!(file instanceof TFile) || leaf?.view instanceof TagAlongView) return;
				if (!this.tree().pathToNote(file.path)) return;
				menu.addItem((item) =>
					item
						.setSection('view')
						.setTitle('Reveal in Tag Along')
						.setIcon('tags')
						.onClick(() => void this.revealNote(file.path)),
				);
			}),
		);
		registerTagClicks(this);

		this.app.workspace.onLayoutReady(() => {
			void this.fixFolderCase();
			this.index.rebuild();
			this.refreshViews();
			this.registerIndexEvents();
			// Show the view once on a fresh install; after that the workspace layout remembers it.
			if (data === null) void this.app.workspace.ensureSideLeaf(VIEW_TYPE, 'left', { reveal: false });
		});
	}

	async onExternalSettingsChange(): Promise<void> {
		const data: unknown = await this.loadData();
		this.settings = migrateSettings(data);
		this.index.rebuild();
		this.settingTab.update();
		this.refreshViews();
	}

	/**
	 * Validates, saves and applies a settings change. Pass a function when the new value depends on
	 * the current settings, so a change never overwrites a newer one.
	 */
	async updateSettings(change: SettingsChange): Promise<void> {
		const previous = this.settings;
		this.settings = applySettingsChange(previous, change);
		if (JSON.stringify(previous) === JSON.stringify(this.settings)) {
			this.refreshViews();
			return;
		}
		await this.saveData(this.settings);
		if (previous.showNoteTitles !== this.settings.showNoteTitles) this.index.rebuild();
		// Lists in the settings tab are part of its definitions, which Obsidian only rebuilds on update().
		this.settingTab.update();
		this.refreshViews();
	}

	private registerIndexEvents(): void {
		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (this.index.update(file)) this.refreshViews();
			}),
		);
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				if (file instanceof TFolder) {
					void this.onFolderRenamed(file.path, oldPath);
					return;
				}
				if (!(file instanceof TFile)) return;
				this.index.remove(oldPath);
				this.index.update(file);
				this.refreshViews();
			}),
		);
		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				// Notes inside a deleted folder may not get their own event.
				if (file instanceof TFolder) {
					this.index.rebuild();
					this.refreshViews();
				} else if (this.index.remove(file.path)) {
					this.refreshViews();
				}
			}),
		);
	}

	private async fixFolderCase(): Promise<void> {
		const existing = this.app.vault.getAllFolders(false).map((folder) => folder.path);
		await this.updateSettings((s) => ({
			includedFolders: fixFolderCase(s.includedFolders, existing),
			excludedFolders: fixFolderCase(s.excludedFolders, existing),
		}));
	}

	/** Notes inside a renamed folder may not get their own event, so re-read everything. */
	private async onFolderRenamed(newPath: string, oldPath: string): Promise<void> {
		this.index.rebuild();
		await this.updateSettings((s) => ({
			includedFolders: renameFolderPaths(s.includedFolders, oldPath, newPath),
			excludedFolders: renameFolderPaths(s.excludedFolders, oldPath, newPath),
		}));
	}

	async revealNote(path: string): Promise<void> {
		const view = await this.openView();
		if (!view?.revealNote(path)) new Notice('This note is not shown in Tag Along.');
	}

	async revealTag(tag: string): Promise<void> {
		const view = await this.openView();
		if (!view?.revealTag(tag)) new Notice(`#${tag.replace(/^#/, '')} is not shown in Tag Along.`);
	}

	private async openView(): Promise<TagAlongView | undefined> {
		const leaf = await this.app.workspace.ensureSideLeaf(VIEW_TYPE, 'left', { active: true, reveal: true });
		await leaf.loadIfDeferred();
		return leaf.view instanceof TagAlongView ? leaf.view : undefined;
	}

	/** Runs `action` on every open view; for commands that only make sense with a view open. */
	private withViews(checking: boolean, action: (view: TagAlongView) => void): boolean {
		const views = this.views();
		if (views.length === 0) return false;
		if (!checking) views.forEach(action);
		return true;
	}

	private views(): TagAlongView[] {
		return this.app.workspace
			.getLeavesOfType(VIEW_TYPE)
			.map((leaf) => leaf.view)
			.filter((view): view is TagAlongView => view instanceof TagAlongView);
	}
}
