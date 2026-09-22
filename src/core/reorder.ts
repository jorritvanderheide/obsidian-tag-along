/**
 * True when dropping the folder of `tag` next to the folder of `target` would put it back where it
 * already is: right before the folder that follows it, or right after the one before it.
 */
export function isSamePlace(siblings: readonly string[], tag: string, target: string, before: boolean): boolean {
	return siblings.indexOf(target) === siblings.indexOf(tag) + (before ? 1 : -1);
}

/**
 * The folder order after dropping the folder of `tag` next to the folder of `target`, given the
 * `siblings` of their level in the order they are shown. The whole level is written down, so the
 * next drag starts from what is on screen. Other levels keep the order they had.
 */
export function reorderFolders(
	order: readonly string[],
	siblings: readonly string[],
	tag: string,
	target: string,
	before: boolean,
): string[] {
	const level = siblings.filter((sibling) => sibling !== tag);
	const index = level.indexOf(target);
	if (index === -1 || !siblings.includes(tag)) return [...order];
	level.splice(before ? index : index + 1, 0, tag);
	return [...order.filter((ordered) => !level.includes(ordered)), ...level];
}
