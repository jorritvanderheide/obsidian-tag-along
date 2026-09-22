import { describe, expect, it } from 'vitest';
import { type FocusRow, moveFocus } from '../src/core/keyboard';

// domain (open)
//   coding (closed)
//   note A
// source (closed)
const rows: FocusRow[] = [
	{ depth: 0, folder: true, open: true },
	{ depth: 1, folder: true, open: false },
	{ depth: 1, folder: false, open: false },
	{ depth: 0, folder: true, open: false },
];

describe('moveFocus', () => {
	it('moves up and down, staying inside the list', () => {
		expect(moveFocus(rows, 1, 'down')).toEqual({ index: 2 });
		expect(moveFocus(rows, 3, 'down')).toEqual({ index: 3 });
		expect(moveFocus(rows, 1, 'up')).toEqual({ index: 0 });
		expect(moveFocus(rows, 0, 'up')).toEqual({ index: 0 });
	});

	it('opens a closed folder with right, then goes to its first row', () => {
		expect(moveFocus(rows, 3, 'right')).toEqual({ index: 3, toggle: true });
		expect(moveFocus(rows, 0, 'right')).toEqual({ index: 1 });
		expect(moveFocus(rows, 2, 'right')).toEqual({ index: 2 });
	});

	it('closes an open folder with left, otherwise goes to the parent folder', () => {
		expect(moveFocus(rows, 0, 'left')).toEqual({ index: 0, toggle: true });
		expect(moveFocus(rows, 2, 'left')).toEqual({ index: 0 });
		expect(moveFocus(rows, 1, 'left')).toEqual({ index: 0 });
		expect(moveFocus(rows, 3, 'left')).toEqual({ index: 3 });
	});

	it('starts at the first row when nothing has focus', () => {
		expect(moveFocus(rows, -1, 'down')).toEqual({ index: 0 });
		expect(moveFocus([], -1, 'down')).toEqual({ index: -1 });
	});
});
