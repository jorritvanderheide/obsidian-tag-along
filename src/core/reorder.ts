/** The two lists that hold the folders put in order by hand, around the ones left to the sort order. */
export interface FolderOrder {
	/** Folders shown before the ones that follow the sort order. */
	folderOrder: string[];
	/** Folders shown after them. */
	folderOrderEnd: string[];
}

/**
 * True when dropping the folder of `tag` next to the folder of `target` would put it back where it
 * already is: right before the folder that follows it, or right after the one before it.
 */
export function isSamePlace(siblings: readonly string[], tag: string, target: string, before: boolean): boolean {
	return siblings.indexOf(target) === siblings.indexOf(tag) + (before ? 1 : -1);
}

/**
 * The folder order after dropping the folder of `tag` next to the folder of `target`, given the
 * `siblings` of their level in the order they are shown. A folder dropped below all the others is
 * kept last, after the folders that follow the sort order; the rest of the level is written down up
 * to the drop, so the next drag starts from what is on screen. Other levels keep the order they had.
 */
export function reorderFolders(
	order: FolderOrder,
	siblings: readonly string[],
	tag: string,
	target: string,
	before: boolean,
): FolderOrder {
	const level = siblings.filter((sibling) => sibling !== tag);
	const index = level.indexOf(target);
	if (index === -1 || !siblings.includes(tag)) {
		return { folderOrder: [...order.folderOrder], folderOrderEnd: [...order.folderOrderEnd] };
	}
	level.splice(before ? index : index + 1, 0, tag);

	// The folders kept last: the ones at the end of the level that were already there, and the
	// dragged folder when it lands among them.
	let last = level.length;
	while (last > 0 && (order.folderOrderEnd.includes(level[last - 1]!) || level[last - 1] === tag)) last--;
	// The folders kept first, up to the drop. The ones below it sit where the sort order puts them
	// anyway, so they are left out and keep following it.
	let first = last;
	while (first > 0 && level[first - 1] !== tag && !order.folderOrder.includes(level[first - 1]!)) first--;

	const outsideLevel = (ordered: string) => !level.includes(ordered);
	return {
		folderOrder: [...order.folderOrder.filter(outsideLevel), ...level.slice(0, first)],
		folderOrderEnd: [...order.folderOrderEnd.filter(outsideLevel), ...level.slice(last)],
	};
}
