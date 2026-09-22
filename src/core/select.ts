/** The items from `from` to `to`, inclusive and in list order, like Shift-click in a file list. */
export function rangeBetween<T>(items: readonly T[], from: T | undefined, to: T): T[] {
	const end = items.indexOf(to);
	const start = from === undefined ? -1 : items.indexOf(from);
	if (end === -1) return [];
	if (start === -1) return [to];
	return items.slice(Math.min(start, end), Math.max(start, end) + 1);
}
