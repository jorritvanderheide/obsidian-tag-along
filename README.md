# Tag Along

[![Donate](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/BW20)

**Browse your vault as a folder tree built from your tags.**

Each tag namespace (`domain/`, `source/`, `status/`, …) becomes its own tree. A note appears under every tag it has, so a note tagged `#domain/coding` and `#source/book` shows up in both places.

```
Meeting notes : #domain/work    #status/active
Research doc  : #domain/coding  #source/book   #status/active
Book summary  : #source/book    #status/done

domain/
  coding/   → Research doc
  work/     → Meeting notes
source/
  book/     → Book summary, Research doc
status/
  active/   → Meeting notes, Research doc
  done/     → Book summary
```

A note is listed in the deepest folder for each of its tags. A note tagged both `#domain` and `#domain/coding` appears only in `domain/coding`.

## Features

- **Compact folders.** A folder whose only content is one sub-folder is shown as a single entry, such as `project/website`.
- **Filter folders.** Inside a folder, your other namespaces appear as grayed-out folders below the notes. Open one to narrow the folder's notes down by that namespace. For example, open `source/book`, then `status`, to see which book notes are `active` or `done`. Filters narrow down the notes listed directly in the folder (sub-folders already split up the rest). They can be chained, and only appear when they actually narrow the notes down.
- **Sorting.** Sort notes by name, modified or created time, and folders by name or number of notes, from the toolbar.
- **Expand or collapse all** folders with one button.
- **Your own order.** Drag a folder up or down to put it where you want it, at any level. The folders you place stay where you put them; the ones you leave alone follow the sort order, in between. Right-click a folder you placed and choose **Follow sort order** to undo it.
- **Pinned folders.** Drop a folder below all the others, or right-click it and choose **Pin to bottom**, to keep it at the bottom of the pane, below the folders that follow the sort order.
- **Flat folders.** Right-click a folder with sub-folders and choose **Flatten folder** to list every note below it in one flat folder, from its sub-tags too.
- **Hidden folders.** Right-click a folder and choose **Hide folder** to hide it with its sub-folders. Its notes still appear under their other tags. Show it again from the **Hidden folders** setting.
- **Top-level folders.** Right-click a sub-folder and choose **Move to top level** to move a sub-tag out of its parent into a top-level folder of its own, merged with a folder of the same name.
- **Folder icons.** Right-click a folder and choose **Set icon...** to show one of Obsidian's icons in place of its collapse arrow.
- **Copy tags.** Right-click a folder to copy the tags that lead to it, such as `#domain/phd #source/ai`.
- **Note menu.** Right-click a note for the same menu as in the core file explorer: open in a new tab or to the right, make a copy, rename, delete, plus the items other plugins add.
- **Selecting several notes.** Alt-click to select notes and Shift-click to select a range, like the core file explorer. Right-click the selection to delete or move the notes. Press Escape to clear it.
- **Reveal notes and tags.** The **Reveal active note** command, and **Reveal in Tag Along** in other file menus, open the folders down to a note. With **Open tags in Tag Along** on, clicking a tag in a note opens its folder (Ctrl/Cmd-click still searches).
- **Keyboard.** Use the arrow keys to move through the tree and open or close folders, Enter to open a note (Ctrl/Cmd+Enter in a new tab), F2 to rename and Delete to delete.
- **Hover previews** with Ctrl/Cmd held, like the core file explorer.
- Open folders are remembered per pane.

## Usage

Open the tree with the ribbon icon or the **Tag Along: Open** command. The buttons at the top of the pane change the sort order, toggle compact folders and filter folders, and expand or collapse all folders.

## Requirements

**Obsidian 1.13** or later, on desktop or mobile.

## Installation

Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/jorritvanderheide/obsidian-tag-along/releases/latest) into `.obsidian/plugins/tag-along/` in your vault, then enable **Tag Along** under Settings → Community plugins.

On first load it adds its pane to the left sidebar.

## Commands

None has a hotkey, so pick your own.

| Command | What it does |
|---|---|
| **Open** | Show the tree in the left sidebar. |
| **Reveal active note** | Open the folders down to the note you have open, and flash it. |
| **Expand all folders** | Open every folder in the tree. |
| **Collapse all folders** | Close every folder in the tree. |
| **Toggle compact folders** | Turn compact folders on or off, like the button at the top of the pane. |
| **Toggle filter folders** | Turn filter folders on or off, like the button at the top of the pane. |

## Settings

| Setting | Default | What it does |
|---|---|---|
| Compact folders | On | Show a folder and its only sub-folder as one entry. |
| Filter folders | On | Show your other namespaces as grayed-out folders to narrow a folder's notes down. |
| Flat folders | None | These folders list every note below them, from their sub-tags too, instead of showing sub-folders. |
| Hidden folders | None | These tags and their sub-tags get no folder, but their notes still appear under their other tags. Folders moved to the top level stay visible even when the tag they came from is hidden. |
| Folder order | None | The folders you dragged into place, and the ones pinned to the bottom of the pane. Remove one to let it follow the sort order again. |
| Top-level folders | None | These sub-tags get a top-level folder of their own, merged with a folder of the same name. |
| Show untagged notes | Off | List notes without tags at the top of the tree. |
| Show note titles | On | Show the `title` property or first heading instead of the file name. |
| Show note counts | Off | Show how many notes each folder contains. |
| Open tags in Tag Along | Off | Clicking a tag in a note opens its folder instead of searching for it. |
| Included folders | Whole vault | Only notes in these folders appear. Leave empty to use the whole vault. |
| Excluded folders | None | Notes in these folders are left out, even inside an included folder. |
| Excluded tags | None | Notes with these tags (or their sub-tags) are left out of the tree. |

## Safety

Tag Along never changes what is in a note. Files change only when you ask for it from its menus or keys: renaming, making a copy, deleting or moving notes. Those go through Obsidian the same way they do in the core file explorer.

Everything else changes only Tag Along's own settings. Its folders are tags, not folders on disk, so hiding, flattening, pinning or moving one leaves your notes alone.

## Upgrading from Tag Explorer

Tag Along was called Tag Explorer up to version 2.1.0. Its plugin id changed with the name, so Obsidian installs it as a new plugin next to the old one. To keep your settings, copy `data.json` from `.obsidian/plugins/tag-explorer/` in your vault to `.obsidian/plugins/tag-along/` while Obsidian is closed, then remove Tag Explorer. Hotkeys for its commands have to be set again.

## Upgrading from 1.x

Settings copied over from 1.x are converted automatically. Some 1.x options were removed:

- **Excluded tags** replaces "Exclude notes with tag" and "Archive tags": notes with these tags are left out of the tree.
- "Hide tags" is now **Hidden folders**. It hides a tag and its sub-tags; matching on the last part of a tag (`old` hiding `domain/old`) is gone.
- "Scan only these folders" is now **Included folders**.
- "Intercept tag clicks" is now **Open tags in Tag Along**.
- Sort orders carry over; sorting by full path became sorting by name.
- Search, dragging notes onto folders, the file title format and the metadata scan delay were removed.
- Pinned folders became two settings: **Folder order**, which you set by dragging folders in the tree, and **Top-level folders** for pinned sub-tags. Existing pins carry over to both.
- 2.0 requires Obsidian 1.13 or newer.

## Development

```sh
nix develop     # or any Node.js 20+
npm install
npm run dev     # rebuild on change
npm run build   # typecheck and production build
npm run lint
npm test
```

Copy `main.js`, `manifest.json` and `styles.css` to `<vault>/.obsidian/plugins/tag-along/` to try it out.

## License

Copyright © 2026 Jorrit van der Heide. Licensed under the [EUPL-1.2](LICENSE).

Tag Along started as a fork of [TagFolder](https://github.com/vrtmrz/obsidian-tagfolder) by vorotamoroz. Version 2 is a rewrite that shares no code with it; releases up to 1.1.1 remain available under the MIT license.
