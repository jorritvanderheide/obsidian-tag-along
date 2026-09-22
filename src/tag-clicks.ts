import { Keymap } from 'obsidian';
import type TagExplorerPlugin from './main';

/**
 * When "Open tags in Tag Explorer" is on, a click on a tag in a note opens its folder instead of
 * searching for it. Ctrl/Cmd-click keeps Obsidian's search.
 */
export function registerTagClicks(plugin: TagExplorerPlugin): void {
	const onClick = (evt: MouseEvent) => {
		if (!plugin.settings.openTagsInExplorer || evt.button !== 0 || Keymap.isModEvent(evt)) return;
		const tag = tagAt(evt.target);
		if (!tag) return;
		evt.preventDefault();
		evt.stopImmediatePropagation();
		void plugin.revealTag(tag);
	};
	// Capture, so Obsidian's own handler that starts a search does not run.
	plugin.registerDomEvent(document, 'click', onClick, { capture: true });
	plugin.registerEvent(
		plugin.app.workspace.on('window-open', (_win, window) => {
			plugin.registerDomEvent(window.document, 'click', onClick, { capture: true });
		}),
	);
}

/** The tag under a click: in reading view, live preview or the tags property. */
function tagAt(target: EventTarget | null): string | undefined {
	const el = target as Node | null;
	if (!el?.instanceOf(HTMLElement)) return undefined;

	const link = el.closest('a.tag');
	if (link) return link.textContent ?? undefined;

	const pill = el.closest('.metadata-property[data-property-key="tags"] .multi-select-pill');
	if (pill) {
		if (el.closest('.multi-select-pill-remove-button')) return undefined;
		return pill.querySelector('.multi-select-pill-content')?.textContent ?? undefined;
	}

	// In source mode a click on a tag only places the cursor.
	const hashtag = el.closest('.cm-hashtag');
	if (hashtag && el.closest('.is-live-preview')) return hashtagText(hashtag);
	return undefined;
}

/** A tag in the editor can be split over several spans, from `cm-hashtag-begin` to `cm-hashtag-end`. */
function hashtagText(span: Element): string | undefined {
	let start: Element | null = span;
	while (start && !start.hasClass('cm-hashtag-begin')) start = start.previousElementSibling;
	let text = '';
	for (let part: Element | null = start; part; part = part.nextElementSibling) {
		text += part.textContent ?? '';
		if (part.hasClass('cm-hashtag-end')) break;
	}
	return text || undefined;
}
