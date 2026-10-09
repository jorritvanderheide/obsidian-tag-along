import { describe, expect, it } from 'vitest';
import { applySettingsChange, DEFAULT_SETTINGS, migrateSettings, SETTINGS_VERSION } from '../src/settings';

describe('migrateSettings', () => {
	it('returns defaults when nothing is stored', () => {
		expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS);
		expect(migrateSettings(undefined)).toEqual(DEFAULT_SETTINGS);
	});

	it('reads settings from a newer version as current ones, not as 1.x', () => {
		const future = { version: SETTINGS_VERSION + 1, showNoteCount: true, folderOrder: ['foo'], useTitle: false, newThing: 1 };
		expect(migrateSettings(future)).toEqual({ ...DEFAULT_SETTINGS, showNoteCount: true, folderOrder: ['foo'] });
	});

	it('keeps valid current settings and repairs invalid values', () => {
		const stored = {
			...DEFAULT_SETTINGS,
			showNoteCount: true,
			filterFolders: 'yes',
			noteSort: 'modified-desc',
			folderSort: 'sideways',
			excludedTags: ['#Archived/', 'archived', 3],
			hiddenFolders: ['#Foo', 'foo/Bar/', 'foo'],
			filterOnlyFolders: ['#Status/', 'status', 'foo/bar'],
			topLevelFolders: ['#Foo/Bar/', 'foo', 'foo/bar'],
			exclusiveFolders: ['#Inbox/', 'inbox'],
			flatFolders: ['#Foo/Bar', 'foo/bar', 3],
			folderOrder: ['#Bar', 'bar', 'foo/qux'],
			folderOrderEnd: ['#Baz', 'foo/qux'],
			folderIcons: { '#Foo/': 'star', bar: 3, '': 'x', baz: '' },
			includedFolders: ['Notes/'],
			excludedFolders: ['/Templates/', ''],
		};
		expect(migrateSettings(stored)).toEqual({
			...DEFAULT_SETTINGS,
			noteSort: 'modified-desc',
			showNoteCount: true,
			excludedTags: ['archived'],
			hiddenFolders: ['foo', 'foo/bar'],
			filterOnlyFolders: ['status'],
			topLevelFolders: ['foo/bar'],
			exclusiveFolders: ['inbox'],
			flatFolders: ['foo/bar'],
			folderOrder: ['bar', 'foo/qux'],
			// A folder kept first is not kept last as well.
			folderOrderEnd: ['baz'],
			folderIcons: { foo: 'star' },
			includedFolders: ['Notes'],
			excludedFolders: ['Templates'],
		});
	});

	it('splits 2.0 pinned folders into moved folders and an order', () => {
		const stored = { version: 2, pinnedFolders: ['status', 'Domain/Coding', 'domain/phd'], showNoteCount: true };
		expect(migrateSettings(stored)).toEqual({
			...DEFAULT_SETTINGS,
			showNoteCount: true,
			topLevelFolders: ['domain/coding', 'domain/phd'],
			// The order went by the name a folder is shown with until version 4, which gave the parent back.
			folderOrder: ['status', 'domain/coding', 'domain/phd'],
		});
	});

	it('gives folders in the order their parent back, once they are shown at the top level', () => {
		const stored = {
			version: 3,
			topLevelFolders: ['literature/finished', 'source/finished'],
			folderOrder: ['inbox', 'finished/2024', 'domain'],
			folderOrderEnd: ['Finished'],
		};
		expect(migrateSettings(stored)).toEqual({
			...DEFAULT_SETTINGS,
			topLevelFolders: ['literature/finished', 'source/finished'],
			// Two moved tags share the name "finished"; the first one wins.
			folderOrder: ['inbox', 'literature/finished/2024', 'domain'],
			folderOrderEnd: ['literature/finished'],
		});
	});

	it('maps the 1.x sort orders', () => {
		const sorts = (sortType: string, sortTypeTag: string) => {
			const { noteSort, folderSort } = migrateSettings({ sortType, sortTypeTag });
			return [noteSort, folderSort];
		};
		expect(sorts('DISPNAME_DESC', 'ITEMS_DESC')).toEqual(['name-desc', 'count-desc']);
		expect(sorts('FULLPATH_ASC', 'ITEMS_ASC')).toEqual(['name-asc', 'count-asc']);
		expect(sorts('CTIME_ASC', 'NAME_DESC')).toEqual(['created-asc', 'name-desc']);
		expect(sorts('nonsense', 'nonsense')).toEqual(['name-asc', 'name-asc']);
	});

	it('turns filter folders off when 1.x isolated namespaces', () => {
		expect(migrateSettings({ namespacedTagGuard: true, filterFolderDepth: 2 }).filterFolders).toBe(false);
		expect(migrateSettings({ namespacedTagGuard: false }).filterFolders).toBe(true);
	});

});

/**
 * data.json as released versions saved it, taken from their tags, with every key they wrote.
 * Whenever the stored shape changes, add a fixture for the last release before the change,
 * named after that version, and a test of what it becomes. See docs/compatibility.md.
 *
 * 1.1.0 saved the same shape as 1.1.1, 2.1.0 and 2.2.0 the same as 2.0.0. 2.3.0 added
 * exclusiveFolders and 2.4.0 filterOnlyFolders; 2.4.0 to 2.5.1 saved the same shape.
 * No release saved version 2 or 3: 1.x saved no version, and 2.0.0 already saved 4.
 */
describe('settings saved by released versions', () => {
	// Tag Explorer 1.1.1: its settings, plus the open folders, which 1.x kept in data.json.
	const v1_1_1 = {
		displayMethod: 'NAME',
		alwaysOpen: true,
		ignoreDocTags: 'draft, private',
		ignoreTags: 'source, domain/old',
		ignoreFolders: 'Templates,\nArchive',
		targetFolders: 'Notes, Journal/',
		sortType: 'MTIME_DESC',
		sortTypeTag: 'NAME_ASC',
		hideItems: 'ALL_EXCEPT_BOTTOM',
		scanDelay: 250,
		useTitle: false,
		frontmatterKey: 'title',
		namespacedTagGuard: false,
		useFrontmatterTagsForNewNotes: false,
		doNotSimplifyTags: true,
		overrideTagClicking: true,
		archiveTags: 'status/archived',
		expandUntaggedToRoot: true,
		disableDragging: false,
		pinnedFolders: ['Coding', 'domain/phd'],
		tagIcons: { Coding: 'code', empty: '' },
		showItemCount: true,
		filterFolderDepth: 2,
		expandedTags: ['domain/'],
	};

	const v2_0_0 = {
		version: 4,
		noteSort: 'modified-desc',
		folderSort: 'count-desc',
		showNoteTitles: false,
		showNoteCount: true,
		compactFolders: false,
		filterFolders: false,
		showUntagged: true,
		openTagsInExplorer: true,
		hiddenFolders: ['source'],
		topLevelFolders: ['domain/coding'],
		flatFolders: ['journal'],
		folderOrder: ['domain/coding', 'status'],
		folderOrderEnd: ['archive'],
		folderIcons: { 'domain/coding': 'code' },
		includedFolders: ['Notes'],
		excludedFolders: ['Templates'],
		excludedTags: ['draft'],
	};

	const v2_5_1 = {
		version: 4,
		noteSort: 'created-asc',
		folderSort: 'modified-desc',
		showNoteTitles: true,
		showNoteCount: false,
		compactFolders: true,
		filterFolders: true,
		showUntagged: false,
		openTagsInExplorer: false,
		hiddenFolders: ['source'],
		filterOnlyFolders: ['status'],
		topLevelFolders: ['domain/coding'],
		exclusiveFolders: ['inbox'],
		flatFolders: ['journal'],
		folderOrder: ['domain/coding/rust', 'inbox'],
		folderOrderEnd: ['archive'],
		folderIcons: { inbox: 'inbox' },
		includedFolders: [],
		excludedFolders: ['Templates'],
		excludedTags: ['draft'],
	};

	it('upgrades 1.1.1', () => {
		expect(migrateSettings(v1_1_1)).toEqual({
			version: SETTINGS_VERSION,
			showNoteTitles: false,
			showNoteCount: true,
			compactFolders: false,
			filterFolders: true,
			showUntagged: true,
			noteSort: 'modified-desc',
			folderSort: 'name-asc',
			openTagsInExplorer: true,
			excludedTags: ['draft', 'private'],
			exclusiveFolders: ['status/archived'],
			hiddenFolders: ['source', 'domain/old'],
			filterOnlyFolders: [],
			// A pin moved a sub-tag to the top level and put it first.
			topLevelFolders: ['domain/phd'],
			folderOrder: ['coding', 'domain/phd'],
			flatFolders: [],
			folderOrderEnd: [],
			folderIcons: { coding: 'code' },
			includedFolders: ['Notes', 'Journal'],
			excludedFolders: ['Templates', 'Archive'],
		});
	});

	it('keeps 2.0.0 settings, with the settings added since empty', () => {
		expect(migrateSettings(v2_0_0)).toEqual({ ...v2_0_0, filterOnlyFolders: [], exclusiveFolders: [] });
	});

	it('keeps 2.5.1 settings as they are', () => {
		expect(migrateSettings(v2_5_1)).toEqual(v2_5_1);
	});
});

describe('applySettingsChange', () => {
	it('applies a patch and validates the result', () => {
		const next = applySettingsChange(DEFAULT_SETTINGS, { folderOrder: ['#Foo'], showNoteCount: 'yes' });
		expect(next).toEqual({ ...DEFAULT_SETTINGS, folderOrder: ['foo'] });
	});

	it('passes the current settings to a change function', () => {
		const current = { ...DEFAULT_SETTINGS, folderIcons: { foo: 'star' } };
		const next = applySettingsChange(current, (s) => ({ folderIcons: { ...s.folderIcons, bar: 'book' } }));
		expect(next.folderIcons).toEqual({ foo: 'star', bar: 'book' });
	});
});
