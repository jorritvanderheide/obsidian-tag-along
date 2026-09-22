import { Menu, Notice } from 'obsidian';
import type { FolderNode, TagTree } from '../core/tree';
import type { PluginHost } from '../host';
import { IconModal } from './icon-modal';

/** The icon chosen for a folder, looked up by the tags it stands for, deepest first. */
export function folderIcon(icons: Record<string, string>, tree: TagTree, node: FolderNode): string | undefined {
	return tree
		.sourceTags(node)
		.map((tag) => icons[tag])
		.find((icon) => icon !== undefined);
}

/** Shows the right-click menu of a tag folder: where it sits in the tree, and its icon. */
export function showFolderMenu(evt: MouseEvent, plugin: PluginHost, tree: TagTree, node: FolderNode): void {
	const menu = new Menu();
	addCopyItem(menu, tree, node);
	addFlatItem(menu, plugin, tree, node);
	addTopLevelItem(menu, plugin, tree, node);
	addPinItem(menu, plugin, tree, node);
	addIconItems(menu, plugin, tree, node);
	menu.showAtMouseEvent(evt);
}

function addCopyItem(menu: Menu, tree: TagTree, node: FolderNode): void {
	const text = tree
		.pathTags(node)
		.map((tag) => `#${tag}`)
		.join(' ');
	menu.addItem((item) =>
		item
			.setSection('action')
			.setTitle('Copy tags')
			.setIcon('copy')
			.onClick(async () => {
				await navigator.clipboard.writeText(text);
				new Notice(`Copied ${text}`);
			}),
	);
}

/** Lets a folder list every note below it instead of showing sub-folders, and go back. */
function addFlatItem(menu: Menu, plugin: PluginHost, tree: TagTree, node: FolderNode): void {
	const target = tree.sourceTags(node)[0];
	// Nothing to flatten in a folder that has no sub-folders.
	if (target === undefined || (!node.isFlat && tree.children(node).folders.length === 0)) return;
	menu.addItem((item) =>
		item
			.setTitle(node.isFlat ? 'Show sub-folders' : 'Hide sub-folders')
			.setIcon(node.isFlat ? 'folder-tree' : 'list')
			.onClick(() => {
				void plugin.updateSettings((s) => ({
					flatFolders: node.isFlat
						? s.flatFolders.filter((tag) => tag !== target)
						: [...s.flatFolders, target],
				}));
			}),
	);
}

/** Lets a sub-tag folder move to the top level, and one that did move go back. */
function addTopLevelItem(menu: Menu, plugin: PluginHost, tree: TagTree, node: FolderNode): void {
	const moved = node.isTopLevel ? tree.tags.movedFrom(node.chain[0] ?? '') : [];
	if (moved.length > 0) {
		menu.addItem((item) =>
			item
				.setTitle('Move back into its parent')
				.setIcon('arrow-down-to-line')
				.onClick(() => {
					void plugin.updateSettings((s) => ({
						topLevelFolders: s.topLevelFolders.filter((tag) => !moved.includes(tag)),
					}));
				}),
		);
		return;
	}
	// A sub-tag moves to the top of the tree with its own sub-tags, under its last name.
	const target = node.isTopLevel ? undefined : tree.tags.originalTag(node.chain[node.chain.length - 1] ?? '');
	if (!target) return;
	menu.addItem((item) =>
		item
			.setTitle('Move to top level')
			.setIcon('arrow-up-to-line')
			.onClick(() => void plugin.updateSettings((s) => ({ topLevelFolders: [...s.topLevelFolders, target] }))),
	);
}

/** Lets a folder be pinned below the folders that follow the sort order, and unpinned again. */
function addPinItem(menu: Menu, plugin: PluginHost, tree: TagTree, node: FolderNode): void {
	const tag = tree.levelTag(node);
	menu.addItem((item) =>
		item
			.setTitle(node.isPinned ? 'Unpin from the bottom' : 'Pin to bottom')
			.setIcon(node.isPinned ? 'pin-off' : 'pin')
			.onClick(() => {
				void plugin.updateSettings((s) => ({
					folderOrder: s.folderOrder.filter((ordered) => ordered !== tag),
					folderOrderEnd: node.isPinned
						? s.folderOrderEnd.filter((ordered) => ordered !== tag)
						: [...s.folderOrderEnd, tag],
				}));
			}),
	);
}

function addIconItems(menu: Menu, plugin: PluginHost, tree: TagTree, node: FolderNode): void {
	const sources = tree.sourceTags(node);
	const current = sources.find((tag) => plugin.settings.folderIcons[tag] !== undefined);
	const target = current ?? sources[0];
	if (target === undefined) return;
	menu.addItem((item) =>
		item
			.setTitle(current ? 'Change icon...' : 'Set icon...')
			.setIcon('image')
			.onClick(() => {
				new IconModal(plugin.app, (icon) => {
					void plugin.updateSettings((s) => ({ folderIcons: { ...s.folderIcons, [target]: icon } }));
				}).open();
			}),
	);
	if (current === undefined) return;
	menu.addItem((item) =>
		item
			.setTitle('Remove icon')
			.setIcon('image-off')
			.onClick(() => {
				void plugin.updateSettings((s) => {
					const rest = { ...s.folderIcons };
					delete rest[current];
					return { folderIcons: rest };
				});
			}),
	);
}
