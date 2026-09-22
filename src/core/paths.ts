/** True when `path` is inside `folder` (or is the folder itself). Case matters, as in Obsidian. */
export function isInFolder(path: string, folder: string): boolean {
	return folder !== '' && (path === folder || path.startsWith(folder + '/'));
}

/**
 * Corrects folder entries that only differ in case from an existing folder, such as entries typed
 * by hand in 1.x, which matched folders regardless of case.
 */
export function fixFolderCase(folders: string[], existing: string[]): string[] {
	const exact = new Set(existing);
	const byLowerCase = new Map(existing.map((folder) => [folder.toLowerCase(), folder]));
	const fixed = folders.map((folder) => (exact.has(folder) ? folder : (byLowerCase.get(folder.toLowerCase()) ?? folder)));
	return fixed.every((folder, i) => folder === folders[i]) ? folders : fixed;
}

/** Points folder entries at `newPath` after the folder at `oldPath` was renamed or moved. */
export function renameFolderPaths(folders: string[], oldPath: string, newPath: string): string[] {
	const moved = (folder: string) => folder === oldPath || folder.startsWith(oldPath + '/');
	if (!folders.some(moved)) return folders;
	return folders.map((folder) => (moved(folder) ? newPath + folder.slice(oldPath.length) : folder));
}
