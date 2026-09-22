import type { App } from 'obsidian';
import type { TagTree } from './core/tree';
import type { SettingsChange, TagExplorerSettings } from './settings';

/**
 * What the pane and its menus need from the plugin: the settings, a way to change them, and the
 * tree that all views share. The plugin provides it; the settings tab takes the plugin itself,
 * as Obsidian's `PluginSettingTab` asks for it.
 */
export interface PluginHost {
	readonly app: App;
	readonly settings: TagExplorerSettings;
	updateSettings(change: SettingsChange): Promise<void>;
	tree(): TagTree;
}
