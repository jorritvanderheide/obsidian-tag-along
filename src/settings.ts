import { FOLDER_SORTS, type FolderSort, NOTE_SORTS, type NoteSort } from './core/sort';
import { normalizeTag } from './core/tags';

/** Bump when stored settings change shape, and add a step to `upgrades`. */
export const SETTINGS_VERSION = 3;

export interface TagExplorerSettings {
	version: typeof SETTINGS_VERSION;
	noteSort: NoteSort;
	folderSort: FolderSort;
	showNoteTitles: boolean;
	showNoteCount: boolean;
	compactFolders: boolean;
	filterFolders: boolean;
	showUntagged: boolean;
	openTagsInExplorer: boolean;
	hiddenFolders: string[];
	/** Sub-tags that get a top-level folder of their own, as written in notes. */
	topLevelFolders: string[];
	/** Folders put in order by hand, shown before the ones left to the sort order. */
	folderOrder: string[];
	/** Icon ids by tag, as written in notes. */
	folderIcons: Record<string, string>;
	includedFolders: string[];
	excludedFolders: string[];
	excludedTags: string[];
}

export const DEFAULT_SETTINGS: TagExplorerSettings = {
	version: SETTINGS_VERSION,
	noteSort: 'name-asc',
	folderSort: 'name-asc',
	showNoteTitles: true,
	showNoteCount: false,
	compactFolders: true,
	filterFolders: true,
	showUntagged: false,
	openTagsInExplorer: false,
	hiddenFolders: [],
	topLevelFolders: [],
	folderOrder: [],
	folderIcons: {},
	includedFolders: [],
	excludedFolders: [],
	excludedTags: [],
};

type Raw = Record<string, unknown>;

/** New values for some settings. Values are validated, so they may come straight from the UI. */
export type SettingsPatch = Partial<Record<keyof TagExplorerSettings, unknown>>;

/** A patch, or a function that builds one from the settings at the moment the change is saved. */
export type SettingsChange = SettingsPatch | ((current: TagExplorerSettings) => SettingsPatch);

export function applySettingsChange(current: TagExplorerSettings, change: SettingsChange): TagExplorerSettings {
	const patch = typeof change === 'function' ? change(current) : change;
	return migrateSettings({ ...current, ...patch });
}

/** Each step turns stored data of version `n` into data of version `n + 1`. 1.x data has no version. */
const upgrades: Record<number, (raw: Raw) => Raw> = {
	1: fromVersion1,
	2: fromVersion2,
};

/**
 * Turns whatever is stored in data.json into valid settings, upgrading older data step by step.
 * Data from a newer version is read as the current version: known settings are kept.
 */
export function migrateSettings(data: unknown): TagExplorerSettings {
	let source: Raw = isRecord(data) ? data : {};
	let version = typeof source.version === 'number' ? source.version : 1;
	for (; version < SETTINGS_VERSION; version++) {
		source = upgrades[version]?.(source) ?? {};
	}
	const d = DEFAULT_SETTINGS;
	return {
		version: SETTINGS_VERSION,
		noteSort: oneOf(NOTE_SORTS, source.noteSort, d.noteSort),
		folderSort: oneOf(FOLDER_SORTS, source.folderSort, d.folderSort),
		showNoteTitles: bool(source.showNoteTitles, d.showNoteTitles),
		showNoteCount: bool(source.showNoteCount, d.showNoteCount),
		compactFolders: bool(source.compactFolders, d.compactFolders),
		filterFolders: bool(source.filterFolders, d.filterFolders),
		showUntagged: bool(source.showUntagged, d.showUntagged),
		openTagsInExplorer: bool(source.openTagsInExplorer, d.openTagsInExplorer),
		hiddenFolders: tags(source.hiddenFolders),
		topLevelFolders: subTags(source.topLevelFolders),
		folderOrder: tags(source.folderOrder),
		folderIcons: icons(source.folderIcons),
		includedFolders: folders(source.includedFolders),
		excludedFolders: folders(source.excludedFolders),
		excludedTags: tags(source.excludedTags),
	};
}

/** Maps 1.x setting names onto the current ones. Settings that were removed are dropped. */
function fromVersion1(raw: Raw): Raw {
	const result: Raw = {
		showNoteTitles: raw.useTitle,
		showNoteCount: raw.showItemCount,
		showUntagged: raw.expandUntaggedToRoot,
		openTagsInExplorer: raw.overrideTagClicking,
		noteSort: typeof raw.sortType === 'string' ? V1_NOTE_SORTS[raw.sortType] : undefined,
		folderSort: typeof raw.sortTypeTag === 'string' ? V1_FOLDER_SORTS[raw.sortTypeTag] : undefined,
		// Notes with archive tags or excluded tags were already kept out of the normal folders.
		excludedTags: [...commaList(raw.ignoreDocTags), ...commaList(raw.archiveTags)],
		pinnedFolders: raw.pinnedFolders,
		folderIcons: raw.tagIcons,
		// "Hide tags" only hid folders, not notes.
		hiddenFolders: commaList(raw.ignoreTags),
		includedFolders: commaList(raw.targetFolders),
		excludedFolders: commaList(raw.ignoreFolders),
	};
	if (typeof raw.doNotSimplifyTags === 'boolean') result.compactFolders = !raw.doNotSimplifyTags;
	// 1.x "isolate namespaces" hid the cross-namespace folders.
	if (typeof raw.namespacedTagGuard === 'boolean') result.filterFolders = !raw.namespacedTagGuard;
	return result;
}

/**
 * Pinning split in two: sub-tags that move to the top level, and the order folders are shown in.
 * A pin did both, so it becomes an entry in each, under the name its folder is shown with.
 */
function fromVersion2(raw: Raw): Raw {
	const pinned = tags(raw.pinnedFolders);
	return {
		...raw,
		topLevelFolders: pinned.filter((tag) => tag.includes('/')),
		folderOrder: pinned.map(lastSegment),
	};
}

// 1.x also sorted by full path; that is now sorted by name.
const V1_NOTE_SORTS: Record<string, NoteSort> = {
	DISPNAME_ASC: 'name-asc',
	DISPNAME_DESC: 'name-desc',
	NAME_ASC: 'name-asc',
	NAME_DESC: 'name-desc',
	FULLPATH_ASC: 'name-asc',
	FULLPATH_DESC: 'name-desc',
	MTIME_ASC: 'modified-asc',
	MTIME_DESC: 'modified-desc',
	CTIME_ASC: 'created-asc',
	CTIME_DESC: 'created-desc',
};

const V1_FOLDER_SORTS: Record<string, FolderSort> = {
	NAME_ASC: 'name-asc',
	NAME_DESC: 'name-desc',
	ITEMS_ASC: 'count-asc',
	ITEMS_DESC: 'count-desc',
};

function oneOf<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
	return options.find((option) => option === value) ?? fallback;
}

function isRecord(value: unknown): value is Raw {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function bool(value: unknown, fallback: boolean): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

function strings(value: unknown): string[] {
	return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function tags(value: unknown): string[] {
	return unique(strings(value).map(normalizeTag));
}

/** Only sub-tags can be moved to the top level; a top-level tag is already there. */
function subTags(value: unknown): string[] {
	return tags(value).filter((tag) => tag.includes('/'));
}

/** The last level of a tag: the name its folder gets at the top level. */
function lastSegment(tag: string): string {
	return tag.slice(tag.lastIndexOf('/') + 1);
}

function icons(value: unknown): Record<string, string> {
	const result: Record<string, string> = {};
	if (!isRecord(value)) return result;
	for (const [tag, icon] of Object.entries(value)) {
		const key = normalizeTag(tag);
		if (key !== '' && typeof icon === 'string' && icon !== '') result[key] = icon;
	}
	return result;
}

function folders(value: unknown): string[] {
	return unique(strings(value).map((f) => f.trim().replace(/^\/+|\/+$/g, '')));
}

function commaList(value: unknown): string[] {
	return typeof value === 'string' ? value.split(/[,\n]/) : [];
}

function unique(values: string[]): string[] {
	return [...new Set(values.filter((v) => v !== ''))];
}
