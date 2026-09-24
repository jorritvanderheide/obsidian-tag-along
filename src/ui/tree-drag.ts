import { isSamePlace } from '../core/reorder';
import type { FolderNode } from '../core/tree';
import type { FolderRow, TreeRenderer } from './tree-renderer';

export interface TreeDragHost {
	renderer(): TreeRenderer;
	/** The folders at the level of `node`, in the order they are shown. */
	siblings(node: FolderNode): FolderNode[];
	reorder(dragged: FolderNode, target: FolderNode, before: boolean): void;
}

interface DropTarget {
	row: FolderRow;
	/** True when the dragged folder goes above the target, false when it goes below it. */
	before: boolean;
}

const DROP_BEFORE = 'tag-along-drop-before';
const DROP_AFTER = 'tag-along-drop-after';

/** Dragging a tag folder to change its order among its siblings. The view forwards its drag events. */
export class TreeDrag {
	private draggedKey: string | null = null;
	/** The row the drop line is drawn on. */
	private indicatorEl: HTMLElement | null = null;

	constructor(private readonly host: TreeDragHost) {}

	onDragStart(evt: DragEvent): void {
		const dragged = this.host.renderer().folderRowAt(evt.target);
		if (!dragged || dragged.node.kind !== 'folder') {
			evt.preventDefault();
			return;
		}
		this.draggedKey = dragged.node.key;
		if (evt.dataTransfer) {
			evt.dataTransfer.effectAllowed = 'move';
			evt.dataTransfer.setData('text/plain', dragged.node.label);
		}
	}

	onDragOver(evt: DragEvent): void {
		const target = this.dropTarget(evt);
		if (!target) {
			this.clearIndicator();
			return;
		}
		// Only a row that takes the drop shows a drop cursor and gets a drop event.
		evt.preventDefault();
		if (evt.dataTransfer) evt.dataTransfer.dropEffect = 'move';
		this.showIndicator(target);
	}

	onDrop(evt: DragEvent): void {
		const target = this.dropTarget(evt);
		const dragged = this.draggedRow();
		// The tree is redrawn right after this, so clean up before it is gone.
		this.onDragEnd();
		if (!target || !dragged) return;
		evt.preventDefault();
		this.host.reorder(dragged.node, target.row.node, target.before);
	}

	onDragEnd(): void {
		this.draggedKey = null;
		this.clearIndicator();
	}

	clearIndicator(): void {
		this.indicatorEl?.removeClasses([DROP_BEFORE, DROP_AFTER]);
		this.indicatorEl = null;
	}

	/** Where the dragged folder would land: another folder of the same level, above or below it. */
	private dropTarget(evt: DragEvent): DropTarget | undefined {
		const dragged = this.draggedRow();
		const row = this.host.renderer().folderRowAt(evt.target);
		if (!dragged || !row || row.node.kind !== 'folder') return undefined;
		if (row.node.key === dragged.node.key) return undefined;
		if (parentKey(row.node) !== parentKey(dragged.node)) return undefined;
		const { top, height } = row.selfEl.getBoundingClientRect();
		const before = evt.clientY < top + height / 2;
		// Dropping right next to where the folder already is would not move it, so it is not offered.
		const siblings = this.host.siblings(dragged.node).map((node) => node.key);
		if (isSamePlace(siblings, dragged.node.key, row.node.key, before)) return undefined;
		return { row, before };
	}

	private draggedRow(): FolderRow | undefined {
		return this.draggedKey === null ? undefined : this.host.renderer().folderRow(this.draggedKey);
	}

	private showIndicator(target: DropTarget): void {
		// The line goes around the whole folder, so below an open folder it lands under its contents.
		const el = target.row.itemEl;
		if (this.indicatorEl !== el) this.clearIndicator();
		this.indicatorEl = el;
		el.toggleClass(DROP_BEFORE, target.before);
		el.toggleClass(DROP_AFTER, !target.before);
	}
}

function parentKey(node: FolderNode): string {
	return node.parent?.key ?? '';
}
