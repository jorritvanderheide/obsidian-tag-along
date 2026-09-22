import { type App, type FuzzyMatch, FuzzySuggestModal, getIconIds, setIcon } from 'obsidian';

/** A searchable list of Obsidian's icons, each shown with a preview. */
export class IconModal extends FuzzySuggestModal<string> {
	constructor(
		app: App,
		private readonly onChoose: (icon: string) => void,
	) {
		super(app);
		this.setPlaceholder('Choose an icon...');
	}

	getItems(): string[] {
		return getIconIds();
	}

	getItemText(icon: string): string {
		return icon.replace(/^lucide-/, '');
	}

	renderSuggestion(match: FuzzyMatch<string>, el: HTMLElement): void {
		el.addClass('tag-explorer-icon-suggestion');
		setIcon(el.createDiv({ cls: 'tag-explorer-icon-suggestion-icon' }), match.item);
		super.renderSuggestion(match, el.createDiv());
	}

	onChooseItem(icon: string): void {
		this.onChoose(icon);
	}
}
