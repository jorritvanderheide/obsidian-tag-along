import { type App, Notice, normalizePath, type TFile } from 'obsidian';
import { fileNameFor, renameHeading } from './core/tags';

/**
 * Gives a note a new title. The first-level heading is the title as written, as the Linter plugin
 * sees it: it changes when it or the `title` property showed the old title, and a `title` property
 * that showed it follows. The file is renamed only when it was named after the old title, so file
 * names that are ids, such as citekeys, stay.
 */
export async function renameNote(app: App, file: TFile, oldTitle: string, title: string): Promise<void> {
	const cache = app.metadataCache.getFileCache(file);
	const heading = cache?.headings?.find((h) => h.level === 1);
	const property: unknown = cache?.frontmatter?.title;
	const propertyMatches = typeof property === 'string' && property.trim() === oldTitle;
	try {
		if (heading && (heading.heading === oldTitle || propertyMatches)) {
			const { start, end } = heading.position;
			await app.vault.process(file, (content) =>
				renameHeading(content, start.offset, end.offset, heading.heading, title),
			);
		}
		if (propertyMatches) {
			await app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
				frontmatter.title = title;
			});
		}
		const name = fileNameFor(title);
		if (file.basename !== fileNameFor(oldTitle) || name === '' || name === file.basename) return;
		const folder = file.parent?.isRoot() === false ? `${file.parent.path}/` : '';
		const path = normalizePath(`${folder}${name}.${file.extension}`);
		if (app.vault.getAbstractFileByPath(path)) new Notice(`Kept the file name, because "${name}" already exists.`);
		else await app.fileManager.renameFile(file, path);
	} catch (error) {
		new Notice(`Couldn't rename the note: ${error instanceof Error ? error.message : String(error)}`);
	}
}
