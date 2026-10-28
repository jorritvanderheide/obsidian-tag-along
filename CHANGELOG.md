# Changelog

What changed in each release of Tag Along, newest first. What counts as
breaking is in [Compatibility](docs/compatibility.md).

## Unreleased

- Drag notes out of the tree, as you would from the file explorer.
- Plainer wording in the settings descriptions, the notices, the README and the FAQ. The command "Reveal active note" is now called "Reveal current note", and its hotkey still works.
- The FAQ said renaming a note always renames its heading and `title` property when the file name is taken. It now says they only change when they showed the old name.

## 2.5.1

- A new FAQ entry for TagFolder users, with TagFolder's settings and the Tag Along settings that do the same thing.
- A new FAQ entry on renaming a folder, which means renaming its tag, with Tag Wrangler.
- How releases are built, and how to check the file you installed, is now under "Network and file disclosure" in the README.
- The install step and the development docs are worded the same way as the other plugins.

## 2.5.0

- Friendlier wording in notices, the rename flow and the settings tab.
- A clearer plugin description: "Browse your vault as a folder tree built from your tags."
- Removed the funding link from the manifest.
- The README has been restructured and now has screenshots, and there's a new FAQ.
- Added issue forms and a security policy.

## 2.4.0

- **Sort folders by most recent note.** A new folder sort, "Most recently modified note first", in the toolbar's sort menu. Each folder is ranked by its most recently modified note, including notes in sub-folders. The tree updates as you edit, so the folder you're working in moves to the top.
- **Filter-only folders.** Right-click a top-level folder and choose **Show only as filter** for tags you only filter by, like `status` or `priority`. The folder leaves the top of the tree but still appears as a filter folder inside other folders. Notes with no other tags count as untagged. Undo it from the new **Filter-only folders** setting. Needs filter folders to be turned on.

## 2.3.0

- Exclusive folders. Right-click a folder and choose Keep notes only here to show its notes in that folder only, and not under their other tags. This suits an inbox or archive tag: remove the tag from a note and it appears under its other tags again. Sub-tags count too, so inbox also covers inbox/later. You can manage the list under Exclusive folders in the settings.
- Rename in place. Choosing Rename… or pressing F2 now makes the note’s name editable right in the tree, as in the core file explorer, instead of opening a dialog. Enter or clicking elsewhere saves, and Escape cancels.
- Renaming changes the title, not just the file. Renaming a note updates its first heading and its title property wherever they showed the old title. The file itself is renamed only if its name matched the old title, so files named by an ID, such as citekeys, keep their names. Characters that aren’t allowed in file names or links are removed from the new file name. If a file with that name already exists, the note keeps its current file name and you get a notice.
- Upgrading from 1.x. “Archive tags” now become Exclusive folders instead of Excluded tags, which is closer to how the setting worked in 1.x.

## 2.2.0

- Renamed from Tag Explorer to **Tag Along**. The plugin id changed from `tag-explorer` to `tag-along`.

### Upgrading from Tag Explorer

Obsidian installs Tag Along as a new plugin next to Tag Explorer. To keep your settings, copy `data.json` from `.obsidian/plugins/tag-explorer/` to `.obsidian/plugins/tag-along/` while Obsidian is closed, then remove Tag Explorer. Hotkeys have to be set again, and CSS snippets that use `tag-explorer-*` names need updating to `tag-along-*`.

## 2.1.0

- Added context menu items for some settings

## 2.0.0

Rewritten from scratch: no Svelte, Obsidian's own file-explorer markup, and Obsidian 1.13 or newer required.

**The tree**
- Each tag namespace is its own tree; a note appears under every tag it has, in the deepest folder for each.
- Compact folders: a folder whose only content is one sub-folder shows as one entry, such as `project/website`.
- Filter folders: your other namespaces appear below a folder's notes, so you can narrow `source/book` down by `status`. Chainable, and only offered when they actually split the notes.
- Flat folders: right-click a folder and choose **Hide sub-folders** to list every note below it in one list, from its sub-tags too.
- Untagged notes can be listed at the top of the tree.

**Arranging folders**
- Drag a folder up or down to put it where you want it, at any level. The folders you leave alone keep following the sort order, in between.
- Pin a folder below all the others with **Pin to bottom**, or by dropping it under its siblings. Pinned folders sit at the foot of the pane.
- **Move to top level** pulls a sub-tag out of its parent into a folder of its own, merged with a folder of the same name.
- **Hidden folders** drop a tag and its sub-tags from the tree, while their notes stay under their other tags.
- Folder icons: any Obsidian icon in place of the collapse arrow.
- Sort notes by name, modified or created time; sort folders by name or note count.

**Changing from 1.x** (settings carry over)
- "Exclude notes with tag" and "Archive tags" became **Excluded tags**; "Hide tags" became **Hidden folders**, now matching a tag and its sub-tags rather than the last part of a tag; "Scan only these folders" became **Included folders**; "Intercept tag clicks" became **Open tags in Tag Explorer**.
- Pinned folders split into **Folder order** (set by dragging) and **Top-level folders**. Existing pins carry over to both.
- Sorting by full path became sorting by name.
- Removed: search, dragging notes onto folders, the file title format, and the metadata scan delay.

## 1.1.1

- Bug fixes and polish

## 1.1.0

- Initial release of the plugin
