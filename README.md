# Tag Explorer

[![Donate](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/BW20)

Browse your vault as a folder tree built from your tags.

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
- **Reveal notes and tags.** The **Reveal active note** command, and **Reveal in Tag Explorer** in other file menus, open the folders down to a note. With **Open tags in Tag Explorer** on, clicking a tag in a note opens its folder (Ctrl/Cmd-click still searches).
- **Keyboard.** Use the arrow keys to move through the tree and open or close folders, Enter to open a note (Ctrl/Cmd+Enter in a new tab), F2 to rename and Delete to delete.
- **Hover previews** with Ctrl/Cmd held, like the core file explorer.
- Open folders are remembered per pane.

## Usage

Open the tree with the ribbon icon or the **Tag Explorer: Open** command. The buttons at the top of the pane change the sort order, toggle compact folders and filter folders, and expand or collapse all folders.

## Settings

| Setting | What it does |
|---|---|
| Compact folders | Show a folder and its only sub-folder as one entry. |
| Filter folders | Show your other namespaces as grayed-out folders to narrow a folder's notes down. |
| Flat folders | These folders list every note below them, from their sub-tags too, instead of showing sub-folders. |
| Hidden folders | These tags and their sub-tags get no folder, but their notes still appear under their other tags. Folders moved to the top level stay visible even when the tag they came from is hidden. |
| Folder order | The folders you dragged into place, and the ones pinned to the bottom of the pane. Remove one to let it follow the sort order again. |
| Top-level folders | These sub-tags get a top-level folder of their own, merged with a folder of the same name. |
| Show untagged notes | List notes without tags at the top of the tree. |
| Show note titles | Show the `title` property or first heading instead of the file name. |
| Show note counts | Show how many notes each folder contains. |
| Open tags in Tag Explorer | Clicking a tag in a note opens its folder instead of searching for it. |
| Included folders | Only notes in these folders appear. Leave empty to use the whole vault. |
| Excluded folders | Notes in these folders are left out, even inside an included folder. |
| Excluded tags | Notes with these tags (or their sub-tags) are left out of the tree. |

## Upgrading from 1.x

Settings carry over automatically. Some 1.x options were removed:

- **Excluded tags** replaces "Exclude notes with tag" and "Archive tags": notes with these tags are left out of the tree.
- "Hide tags" is now **Hidden folders**. It hides a tag and its sub-tags; matching on the last part of a tag (`old` hiding `domain/old`) is gone.
- "Scan only these folders" is now **Included folders**.
- "Intercept tag clicks" is now **Open tags in Tag Explorer**.
- Sort orders carry over; sorting by full path became sorting by name.
- Search, dragging notes onto folders, the file title format and the metadata scan delay were removed.
- Pinned folders became two settings: **Folder order**, which you set by dragging folders in the tree, and **Top-level folders** for pinned sub-tags. Existing pins carry over to both.
- 2.0 requires Obsidian 1.13 or newer.

## Development

```sh
npm install
npm run dev     # rebuild on change
npm run build   # typecheck and production build
npm run lint
npm test
```

Copy `main.js`, `manifest.json` and `styles.css` to `<vault>/.obsidian/plugins/tag-explorer/` to try it out.

## License

Copyright © 2026 Jorrit van der Heide. Licensed under the [EUPL-1.2](LICENSE).

Tag Explorer started as a fork of [TagFolder](https://github.com/vrtmrz/obsidian-tagfolder) by vorotamoroz. Version 2 is a rewrite that shares no code with it; releases up to 1.1.1 remain available under the MIT license.
