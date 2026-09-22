import { describe, expect, it } from 'vitest';
import { applySettingsChange, DEFAULT_SETTINGS, migrateSettings, SETTINGS_VERSION } from '../src/settings';

describe('migrateSettings', () => {
	it('returns defaults when nothing is stored', () => {
		expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS);
		expect(migrateSettings(undefined)).toEqual(DEFAULT_SETTINGS);
	});

	it('reads settings from a newer version as current ones, not as 1.x', () => {
		const future = { version: 4, showNoteCount: true, folderOrder: ['foo'], useTitle: false, newThing: 1 };
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
			topLevelFolders: ['#Foo/Bar/', 'foo', 'foo/bar'],
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
			topLevelFolders: ['foo/bar'],
			flatFolders: ['foo/bar'],
			folderOrder: ['bar', 'foo/qux'],
			// A folder kept first is not kept last as well.
			folderOrderEnd: ['baz'],
			folderIcons: { foo: 'star' },
			includedFolders: ['Notes'],
			excludedFolders: ['Templates'],
		});
	});

	it('upgrades 1.x settings', () => {
		const v1 = {
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
			doNotSimplifyTags: true,
			overrideTagClicking: true,
			archiveTags: 'status/archived',
			expandUntaggedToRoot: true,
			pinnedFolders: ['Coding'],
			tagIcons: { Coding: 'code', empty: '' },
			showItemCount: true,
			filterFolderDepth: 2,
			expandedTags: ['domain/'],
		};
		expect(migrateSettings(v1)).toEqual({
			version: SETTINGS_VERSION,
			showNoteTitles: false,
			showNoteCount: true,
			compactFolders: false,
			filterFolders: true,
			showUntagged: true,
			noteSort: 'modified-desc',
			folderSort: 'name-asc',
			openTagsInExplorer: true,
			excludedTags: ['draft', 'private', 'status/archived'],
			hiddenFolders: ['source', 'domain/old'],
			topLevelFolders: [],
			flatFolders: [],
			folderOrder: ['coding'],
			folderOrderEnd: [],
			folderIcons: { coding: 'code' },
			includedFolders: ['Notes', 'Journal'],
			excludedFolders: ['Templates', 'Archive'],
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
