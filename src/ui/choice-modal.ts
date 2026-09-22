import { type App, FuzzySuggestModal } from 'obsidian';

/** A searchable picker for a list of items. */
export class ChoiceModal<T> extends FuzzySuggestModal<T> {
	constructor(
		app: App,
		private readonly items: T[],
		private readonly textOf: (item: T) => string,
		placeholder: string,
		private readonly onChoose: (item: T) => void,
	) {
		super(app);
		this.setPlaceholder(placeholder);
	}

	getItems(): T[] {
		return this.items;
	}

	getItemText(item: T): string {
		return this.textOf(item);
	}

	onChooseItem(item: T): void {
		this.onChoose(item);
	}
}
