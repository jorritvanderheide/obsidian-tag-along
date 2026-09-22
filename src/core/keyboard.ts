export interface FocusRow {
	depth: number;
	folder: boolean;
	open: boolean;
}

export type FocusKey = 'up' | 'down' | 'left' | 'right';

/**
 * Where arrow keys move the focus in the tree, like the core file explorer: up and down move one row,
 * right opens a folder or enters it, left closes a folder or goes to its parent.
 * `toggle` means the focused folder should be opened or closed instead of moving.
 */
export function moveFocus(rows: readonly FocusRow[], index: number, key: FocusKey): { index: number; toggle?: true } {
	if (rows.length === 0) return { index: -1 };
	const row = rows[index];
	if (!row) return { index: 0 };
	switch (key) {
		case 'up':
			return { index: Math.max(index - 1, 0) };
		case 'down':
			return { index: Math.min(index + 1, rows.length - 1) };
		case 'right': {
			if (!row.folder) return { index };
			if (!row.open) return { index, toggle: true };
			const next = rows[index + 1];
			return { index: next && next.depth > row.depth ? index + 1 : index };
		}
		case 'left': {
			if (row.folder && row.open) return { index, toggle: true };
			for (let i = index - 1; i >= 0; i--) {
				if ((rows[i]?.depth ?? 0) < row.depth) return { index: i };
			}
			return { index };
		}
	}
}
