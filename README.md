# Tag Along

**Browse your vault as a folder tree built from your tags.**

Works well with [Loose Ends](https://community.obsidian.md/plugins/loose-ends),
which keeps track of the notes you haven't tagged yet, and
[Paper Trail](https://community.obsidian.md/plugins/paper-trail), which tags
your papers by reading status. See [Works well with](#10-works-well-with).

<br/>

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22tag-along%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)
![Obsidian Compatibility](https://img.shields.io/badge/Obsidian-v1.13.1+-483699?logo=obsidian&style=flat-square)
![Desktop and mobile](https://img.shields.io/badge/platform-desktop%20%7C%20mobile-483699?style=flat-square)
[![Checks](https://github.com/jorritvanderheide/obsidian-tag-along/actions/workflows/ci.yml/badge.svg)](https://github.com/jorritvanderheide/obsidian-tag-along/actions/workflows/ci.yml)
[![License: EUPL-1.2](https://img.shields.io/badge/license-EUPL--1.2-blue?style=flat-square)](LICENSE)

![Tag Along next to a note tagged domain/privacy and source/article: the note is in the Privacy folder, and also in Article through the grey Source filter folder](https://raw.githubusercontent.com/jorritvanderheide/obsidian-tag-along/main/images/hero.png)

Folders make you choose. A summary of a book about coding goes in `Books`, or
in `Coding`, but not in both, and half the time you look in the wrong one. Tags
don't have that problem: a note can have as many as it needs. But Obsidian's
tag pane is a flat list, and it doesn't show you the notes.

Did you know Obsidian lets you
[nest tags](https://obsidian.md/help/tags#Nested+tags) with a slash? `#source/book`
is a `book` tag inside a `source` tag, and `#source/article` sits right next to
it. Tag Along turns those nested tags into the folder tree you'd want. Every
top-level tag, like `source`, `domain` or `status`, becomes a tree of its own,
and a note shows up under every tag it has. So the book summary sits in
`source/book` and in `domain/coding`, and you find it wherever you look.

<br/>

## 1 Installation

In Obsidian, go to Settings → Community plugins → Browse, search for
"Tag Along", and install and enable it. You can also find it on
[its page in the plugin directory](https://community.obsidian.md/plugins/tag-along).

Tag Along needs Obsidian 1.13 or later, and works on desktop and mobile.

<br/>

## 2 Getting started

The first time it loads, Tag Along adds its pane to the left sidebar. If you
close it, open it again with the ribbon icon or **Tag Along: Open**.

Your tags are the folders. Say you have three notes:

```
Meeting notes : #domain/work    #status/active
Research doc  : #domain/coding  #source/book   #status/active
Book summary  : #source/book    #status/done
```

Tag Along shows them like this:

```
domain/
  coding/   → Research doc
  work/     → Meeting notes
source/
  book/     → Book summary, Research doc
status/
  active/   → Meeting notes, Research doc
  done/     → Book summary
```

A note tagged both `#domain` and `#domain/coding` only shows up in
`domain/coding`, the deepest of the two.

Now open `source/book`. Below its notes, the grey `domain` and `status` folders
are filter folders. Open `status`, and you see which of your book notes are
`active` and which are `done`.

Here's the same idea in a bigger vault: the `Privacy` folder, narrowed down by
the `Source` filter folder to the notes that came from an article.

![The Privacy folder with its notes, and below them the grey Source filter folder, opened to Article, which narrows the notes down to two](https://raw.githubusercontent.com/jorritvanderheide/obsidian-tag-along/main/images/filter-folders.png)

The buttons at the top of the pane change the sort order, switch compact
folders and filter folders on or off, and expand or collapse all folders.

<br/>

## 3 Safety and quality

The folders in Tag Along are your tags, so arranging them never moves a file.
Hiding, flattening, pinning, moving or reordering a folder only changes Tag
Along's own settings. Your notes only change when you rename, copy, move or
delete one from Tag Along, and those go through Obsidian the same way they do in
the core file explorer. [Section 11](#11-network-and-file-disclosure) lists
exactly what it changes and when.

It doesn't connect to the internet and doesn't run any programs.

It's built for big vaults. A test vault of 20,000 notes, each with three to six
tags, turns into a tree in about 0.16 seconds on a laptop, and only the folders
you open are worked out.

Every change is tested. Every release is built in public on GitHub, and you
can check that the file you installed is the one GitHub built.
[Section 11.4](#114-how-releases-are-built) shows how.

<br/>

## Table of contents

- [4 Documentation](#4-documentation)
- [5 Features](#5-features)
- [6 How it works](#6-how-it-works)
- [7 Keyboard and mouse](#7-keyboard-and-mouse)
- [8 Commands](#8-commands)
- [9 Settings](#9-settings)
- [10 Works well with](#10-works-well-with)
- [11 Network and file disclosure](#11-network-and-file-disclosure)
- [12 Questions or issues?](#12-questions-or-issues)
- [13 Support](#13-support)
- [14 License](#14-license)

<br/>

## 4 Documentation

If you want to work on the plugin:

- [**Architecture**](docs/architecture.md) - How the code is layered, and how a
  change in your vault finds its way into the tree.
- [**Tree model**](docs/tree-model.md) - The exact rules for every kind of
  folder, and what happens when they meet.
- [**Settings**](docs/settings.md) - How settings are stored, checked and
  upgraded from older versions.
- [**Compatibility**](docs/compatibility.md) - What a release may and may not
  change, so your settings and hotkeys keep working.
- [**Performance**](docs/performance.md) - The benchmarks, how to run them, and
  the current numbers.
- [**Development**](docs/development.md) - Setup, tests, checks and releases.

<br/>

## 5 Features

### 5.1 The tree

- **One tree per top-level tag** - `domain`, `source` and `status` each get a
  tree of their own, with their nested tags as folders.
- **A note in every folder it belongs to** - A note shows up under each of its
  tags.
- **Compact folders** - A folder that holds nothing but one sub-folder is shown
  as a single entry, such as `project/website`.
- **Note titles** - Show a note's `title` property or first heading instead of
  its file name.
- **Note counts** - See how many notes each folder holds.
- **Untagged notes** - Notes without tags can be listed at the top of the tree,
  if you like.

### 5.2 Narrowing down

- **Filter folders** - Inside a folder, your other top-level tags appear in grey
  below the notes. Open one to narrow the folder's notes down by that tag.
- **Filter-only folders** - Keep tags like `status` or `priority` out of the
  top of the tree, and only use them as filters.
- **Exclusive folders** - Notes in an `inbox` or `archive` folder show up there
  and nowhere else, until you remove the tag.
- **Hidden folders** - Hide a tag and its sub-tags. Its notes still show up
  under their other tags.
- **Included and excluded folders** - Choose which parts of your vault the tree
  shows, and leave out notes with certain tags.

### 5.3 Arranging

- **Sorting** - Sort notes by name, modified or created time, and folders by
  name, number of notes, or most recently modified note.
- **Your own order** - Drag a folder to where you want it, at any level. The
  folders you leave alone follow the sort order.
- **Pinned folders** - Keep a folder at the bottom of the pane.
- **Top-level folders** - Move a sub-tag out of its parent and give it a
  top-level folder of its own.
- **Flat folders** - List every note below a folder in one list, without its
  sub-folders.
- **Folder icons** - Show one of Obsidian's icons in place of a folder's arrow.

### 5.4 Working with notes

- **The menu you know** - Right-click a note for the same menu as in the core
  file explorer, including what other plugins add.
- **Several notes at once** - Alt-click and Shift-click to select notes, then
  delete, move or drag them together.
- **Drag notes out** - Drop a note in another note to link to it, or anywhere
  else you'd drop one from the core file explorer.
- **Rename in place** - Press F2 to rename a note right in the tree.
- **Hover previews** - Hold Ctrl or Cmd and hover over a note.
- **Copy tags** - Right-click a folder to copy the tags that lead to it, such as
  `#source/book #status/active`.

### 5.5 Finding your way

- **Reveal the note you're in** - Open the folders down to the current note,
  from the command palette or any file menu.
- **Click a tag, open its folder** - If you turn it on, clicking a tag in a note
  opens its folder instead of a search.
- **Keyboard navigation** - Move through the tree with the arrow keys, like in
  the core file explorer.
- **Remembers what's open** - Each pane remembers which folders you had open.

<br/>

## 6 How it works

### 6.1 From tags to folders

Every tag becomes a folder, and every `/` in a tag becomes a level. The part
before the first `/`, like `domain` in `domain/coding`, is the top-level tag,
and each top-level tag is a tree at the top of the pane.

A note tagged `#domain` and `#domain/coding` is listed in `domain/coding` only.
Tag Along only lists a note in the deepest folders its tags reach, because
otherwise every note would show up again in every parent folder. A note with
tags under three top-level tags shows up in three trees.

Upper and lower case don't matter, so `#Book` and `#book` end up in the same
folder. The folder is named the way the tag is spelled in the first note that
has it.

### 6.2 Filter folders

Filter folders let you combine top-level tags. Open `domain/coding`, then the
grey `source` folder inside it, then `book`, and you see the notes on coding
that came from a book.

Below the notes in a folder, you'll find your other top-level tags in grey,
apart from the ones you used to get there. They only sort through the notes
listed directly in the folder, because its sub-folders already split up the
rest. You can open one filter folder inside another, like `source` and then
`status`. Tag Along only offers one when it narrows something down. At least two
of the notes need a tag under it, and they can't all have the same one.

### 6.3 When folder settings meet

Most of the time each setting does one simple thing. Here's what happens when a
few of them meet on the same tag:

- Say you move `project/reading` to the top level and then hide `project`.
  `reading` stays visible, because it doesn't live in `project` anymore.
- If you also have a plain `reading` tag, the moved `project/reading` joins it,
  and you get one `reading` folder for both.
- Make `inbox` exclusive, and a note tagged `#inbox` and `#domain/work` only
  shows up in `inbox`. Once you take `#inbox` off, it's back in `domain/work`.
- Make `status` filter-only, and a note tagged only `#status/active` has no
  folder to be in. It counts as untagged.
- A flat folder lists all the notes below it, so compact folders never merge it
  with a sub-folder.
- Filter folders always follow the sort order. You can't drag, pin or flatten
  them.

<br/>

## 7 Keyboard and mouse

When the Tag Along pane has focus:

| Key | Action |
| --- | --- |
| ↑ / ↓ | Move up or down one row |
| → | Open a folder, or go into an open one |
| ← | Close a folder, or go to its parent |
| Enter | Open the note, or open or close the folder |
| Ctrl/Cmd+Enter | Open the note in a new tab |
| F2 | Rename the note |
| Delete or Backspace | Delete the note, or all selected notes |
| Escape | Clear the selection |

| Mouse | Action |
| --- | --- |
| Click | Open a note, or open or close a folder |
| Ctrl/Cmd+click | Open the note in a new tab |
| Alt+click | Add a note to the selection, or take it out |
| Shift+click | Select every note between the last one and this one |
| Right-click | The note or folder menu, or the menu for the selection |
| Drag a folder | Put it in your own order, or drop it below all others to pin it |
| Drag a note | Drop it in a note to link to it, like from the file explorer. Drags all selected notes when it's one of them |
| Ctrl/Cmd+hover | Preview the note |

Deleting works the way it does in the file explorer, so Obsidian asks you first
if your settings say it should.

<br/>

## 8 Commands

None of the commands come with a hotkey, so they won't clash with the ones
you already use. You can set your own in Settings → Hotkeys.

- `Tag Along: Open` - Shows the tree in the left sidebar. Also available from
  the ribbon.
- `Tag Along: Reveal current note` - Opens the folders down to the note you have
  open, and highlights it. Also in the file menu as **Reveal in Tag Along**.
- `Tag Along: Expand all folders` - Opens every folder in the tree.
- `Tag Along: Collapse all folders` - Closes every folder in the tree.
- `Tag Along: Toggle compact folders` - The same as the button at the top of the
  pane.
- `Tag Along: Toggle filter folders` - The same as the button at the top of the
  pane.

<br/>

## 9 Settings

Most folder settings can also be changed by right-clicking a folder. The lists
in the settings are where you undo them.

**Folders**

| Setting | Default | |
| --- | --- | --- |
| **Compact folders** | On | Show a folder and its only sub-folder as one entry. |
| **Filter folders** | On | Show your other top-level tags as grey folders, to narrow a folder's notes down. |
| **Folder order** | None | Folders you dragged into place come first, and folders you pinned to the bottom come last. All the others follow the sort order, in between. Remove one to put it back in sort order. |
| **Top-level folders** | None | Sub-tags that get a folder of their own at the top of the tree. One with the same name as a top-level folder joins it. They aren't offered as filter folders. |
| **Flat folders** | None | Folders that list every note below them, from their sub-tags too, instead of showing sub-folders. |
| **Exclusive folders** | None | Notes with these tags, or their sub-tags, only show up in these folders. Their other tags are ignored, in the tree and in filter folders. |
| **Filter-only folders** | None | Top-level tags you only filter by, like `status`. They only show up as grey filter folders inside other folders, and not at all with filter folders off. A note with no other tags counts as untagged. |
| **Hidden folders** | None | Tags and their sub-tags that get no folder, and no filter folder either. Their notes still show up under their other tags, and a note with no other tags counts as untagged. A sub-tag you moved to the top level stays visible. |
| **Show untagged notes** | Off | List notes without tags at the top of the tree. |

**Notes**

| Setting | Default | |
| --- | --- | --- |
| **Show note titles** | On | Show the `title` property or first heading instead of the file name. |
| **Show note counts** | Off | Show how many notes each folder holds. |
| **Open tags in Tag Along** | Off | Clicking a tag in a note opens its folder instead of searching for it. Ctrl/Cmd-click still searches. |

**Which notes to show**

| Setting | Default | |
| --- | --- | --- |
| **Included folders** | Whole vault | Only notes in these folders show up. Leave it empty for the whole vault. |
| **Excluded folders** | None | Notes in these folders are left out, even inside an included folder. |
| **Excluded tags** | None | Notes with these tags, or their sub-tags, are left out of the tree. |

<br/>

## 10 Works well with

I made these too. Each one does one thing and works on its own, but they fit
together nicely.

### 10.1 Loose Ends

[Loose Ends](https://community.obsidian.md/plugins/loose-ends) lets you write a
note now and tag it later. You tell it which kinds of tag every note needs, like
a `domain/…` tag and a `source/…` tag, and until a note has them all, it gets
one extra tag saying it isn't filed yet.

In Tag Along, `domain` and `source` are each a tree, and the extra tag is a folder
of everything still waiting. Set Loose Ends' unfiled tag to `inbox`, and make
`inbox` an exclusive folder in Tag Along. A new note then only shows up in
`inbox`, and moves to its proper folders the moment you've finished tagging it.

![Tag Along with the inbox folder at the top, holding the notes that still need tags, and the domain tree below](https://raw.githubusercontent.com/jorritvanderheide/obsidian-tag-along/main/images/loose-ends.png)

### 10.2 Paper Trail

[Paper Trail](https://community.obsidian.md/plugins/paper-trail) turns your
Zotero library into a reading queue. Set its **Status tag** to `status`, and
your papers show up in Tag Along under `status/queued`, `status/summarised` and
so on. Open one, and the filter folders let you narrow it down by topic.

<br/>

## 11 Network and file disclosure

Tag Along runs entirely on your device. It never connects to the internet and
doesn't send anything anywhere.

### 11.1 What it reads

- **Notes:** The tags, `title` property and first heading of the Markdown notes
  in your vault, which it gets from Obsidian's own index of your notes.

### 11.2 What it changes in your notes

Only when you ask for it, and only these:

- **Rename** (F2, or the note menu): Changes the note's first heading and its
  `title` property, if they showed the old name, and renames the file, if it was
  named after the old name. A file name that isn't the title, like an ID or a
  citation key, stays as it is.
- **Make a copy:** Creates a copy next to the note.
- **Delete:** Deletes the note through Obsidian, which asks first if your
  settings say so.
- **Move:** Through Obsidian's own move dialog, from the menu for selected
  notes.
- **Drag:** Dragging a note out of the tree hands it to Obsidian, the way the
  core file explorer does. Drop it in a note and Obsidian adds a link there.

Nothing else Tag Along does changes a note. Everything you do to folders, like
hiding or pinning one, only changes Tag Along's own settings.

### 11.3 What it stores

- **Settings:** Its own `data.json` in the plugin folder.
- **Open folders:** Which folders are open in each pane, saved with Obsidian's
  workspace layout.
- **Clipboard:** When you choose **Copy tags**, it puts the tags on your
  clipboard. Nothing else is ever put there.

### 11.4 How releases are built

Every change I push is built, checked with [ESLint](https://eslint.org/) and
the official [Obsidian ESLint plugin](https://github.com/obsidianmd/eslint-plugin),
and tested with [Vitest](https://vitest.dev/). Nix builds it a second time,
on its own.

Releases are built by GitHub Actions from the tagged code, after the same
checks. A release only goes out when its tag matches the version in
`manifest.json`, and every action it uses is pinned to an exact version. Each
release comes with a signed attestation from GitHub, which records what it
was built from. To check that the `main.js` you installed is the one GitHub
built:

```sh
gh attestation verify main.js --repo jorritvanderheide/obsidian-tag-along
```

<br/>

## 12 Questions or issues?

Have a look at the [FAQ](FAQ.md) first. It covers the things people run into
most, like a note that doesn't show up where you expect. If something still
doesn't work, or you have an idea, please
[open an issue](https://github.com/jorritvanderheide/obsidian-tag-along/issues/new/choose).
Found a security problem? Please report it privately, the way the
[security policy](SECURITY.md) explains.

The code lives on [Codeberg](https://codeberg.org/BW20/obsidian-tag-along),
with a copy on [GitHub](https://github.com/jorritvanderheide/obsidian-tag-along).

<br/>

## 13 Support

Tag Along is free. If it's useful to you and you'd like to give something back,
you can do that on Liberapay:

[![Donate](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/BW20)

<br/>

## 14 License

Copyright © 2026 Jorrit van der Heide. Licensed under the [EUPL-1.2](LICENSE).

Tag Along started as a fork of [TagFolder](https://github.com/vrtmrz/obsidian-tagfolder)
by vorotamoroz. Version 2 is a complete rewrite and shares no code with it, and
the releases up to 1.1.1 are still available under the MIT license.
