import { bench, describe } from 'vitest';
import { type FolderNode, TagTree, type TreeOptions } from '../src/core/tree';
import { generateNotes } from './generate';

const notes = generateNotes(20_000);
const options: TreeOptions = {
	compactFolders: true,
	filterFolders: true,
	showUntagged: false,
	hiddenFolders: ['topic/value-1'],
	topLevelFolders: ['project/value-2'],
	flatFolders: [],
	folderOrder: ['status'],
	folderOrderEnd: [],
	noteSort: 'name-asc',
	folderSort: 'name-asc',
};

/** Computes every tag folder, like "Expand all". */
function expandAll(tree: TagTree): number {
	let count = 0;
	const walk = (folders: FolderNode[]) => {
		for (const node of folders) {
			count++;
			walk(tree.children(node).folders);
		}
	};
	walk(tree.root().folders);
	return count;
}

describe('20,000 notes', () => {
	bench('build the tree and its top level', () => {
		new TagTree(notes, options).root();
	});

	bench('expand all folders', () => {
		expandAll(new TagTree(notes, options));
	});

	bench('expand all folders without filter folders', () => {
		expandAll(new TagTree(notes, { ...options, filterFolders: false }));
	});
});
