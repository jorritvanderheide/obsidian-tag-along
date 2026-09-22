import { type App, Modal, normalizePath, Setting, type TFile } from 'obsidian';

/** Asks for a new name for a note and renames it, updating links like the core file explorer. */
export class RenameModal extends Modal {
	constructor(
		app: App,
		private readonly file: TFile,
	) {
		super(app);
	}

	onOpen(): void {
		this.setTitle('Rename note');
		let name = this.file.basename;
		const submit = () => void this.rename(name);
		new Setting(this.contentEl).setName('New name').addText((text) => {
			text.setValue(name).onChange((value) => (name = value));
			text.inputEl.addEventListener('keydown', (evt) => {
				if (evt.key === 'Enter') submit();
			});
			window.setTimeout(() => text.inputEl.select(), 0);
		});
		new Setting(this.contentEl).addButton((button) => button.setButtonText('Rename').setCta().onClick(submit));
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async rename(name: string): Promise<void> {
		const trimmed = name.trim();
		if (trimmed === '' || trimmed === this.file.basename) {
			this.close();
			return;
		}
		const folder = this.file.parent?.isRoot() === false ? `${this.file.parent.path}/` : '';
		await this.app.fileManager.renameFile(this.file, normalizePath(`${folder}${trimmed}.${this.file.extension}`));
		this.close();
	}
}
