# Frequently asked questions

Can't find your answer here? Please
[open an issue](https://github.com/jorritvanderheide/obsidian-tag-along/issues/new/choose).

- [Where's my note?](#wheres-my-note)
- [Folders](#folders)
- [Tags and notes](#tags-and-notes)
- [Other](#other)

## Where's my note?

### A note doesn't show up in the tree

Check these in order:

- **Does it have tags?** Notes without tags are only listed when **Show
  untagged notes** is on.
- **Is it in an excluded folder, or outside the included folders?** See **Which
  notes to show** in the settings.
- **Does it have an excluded tag?** A note with an excluded tag, or a sub-tag of
  one, is left out completely.
- **Are all its tags filter-only?** Then it has no folder to be in, and counts
  as untagged.
- **Is it a Markdown note?** Tag Along only shows `.md` files, because only
  those have tags.

### "This note is not shown in Tag Along."

You tried to reveal a note that isn't in the tree, for one of the reasons above.

### "#… is not shown in Tag Along."

You clicked a tag whose folder isn't in the tree: it's hidden, excluded, or
filter-only. Ctrl-click or Cmd-click a tag to search for it instead.

### A note is in `domain/coding`, but not in `domain`

That's on purpose. A note is listed in the deepest folder for each of its tags,
so a note tagged `#domain` and `#domain/coding` shows up in `domain/coding`
only. Otherwise every note would show up again in every parent folder.

### A note only shows up in one folder, although it has more tags

One of its tags is an exclusive folder. A note with an exclusive tag only shows
up there, and its other tags are ignored until you remove that tag. That's what
makes an `inbox` or `archive` folder work.

## Folders

### Why is there no filter folder for one of my tags?

Tag Along only offers a filter folder when it actually narrows something down.
It looks at the notes listed directly in the folder, not the ones in its
sub-folders, and it needs at least two of them with a tag under that top-level
tag, and not all with the same one. A top-level tag you already used on the way
to this folder isn't offered again.

### Two of my tags became one folder

Tags are matched without regard to case, so `#Book` and `#book` are one folder.
And a sub-tag you moved to the top level merges with a top-level tag of the same
name: `project/reading` moved to the top level joins a plain `reading`.

### I hid a folder, but part of it is still there

A sub-tag you moved to the top level stays visible when you hide its parent,
because it doesn't live there anymore. Move it back into its parent first, from
its right-click menu.

### How do I undo hiding, pinning or flattening a folder?

Most of these are undone from the same right-click menu. A hidden folder isn't
in the tree anymore, so you show it again from **Hidden folders** in the
settings, and a filter-only folder from **Filter-only folders**.

### Can I drag a note onto a folder to tag it?

No. Dragging only puts folders in your own order. To tag a note, edit its tags
in the note.

## Tags and notes

### Clicking a tag still searches instead of opening its folder

Turn on **Open tags in Tag Along** in the settings. Ctrl-click or Cmd-click
always searches. In source mode, clicking a tag only places the cursor, the way
it does without Tag Along.

### Renaming a note changed its heading

When you rename a note from Tag Along, it changes the name you see: the first
heading and the `title` property, if they showed the old name. The file is only
renamed when it was named after the old name too, so a file name that's an ID
or a citation key stays as it is.

### "Kept the file name, as … already exists."

The new name was already taken by another file in the same folder. The heading
and `title` property were renamed, the file name stayed the same.

### Does Tag Along change my notes?

Only when you ask for it: renaming, copying, moving or deleting a note. Hiding,
flattening, pinning, moving and reordering folders only change Tag Along's own
settings. See
[section 11 of the README](README.md#11-network-and-file-disclosure).

## Other

### Does it work on mobile?

Yes. The tree, the menus and the settings all work on a phone or tablet. What
needs a keyboard or a mouse doesn't: keyboard navigation, selecting with
Alt-click or Shift-click, and hover previews.

### Does it work in a big vault?

Yes. A test vault of 20,000 notes turns into a tree in about 0.16 seconds on a
laptop, and only the folders you open are worked out. See
[Performance](docs/performance.md).

### Why don't the commands have hotkeys?

You already have hotkeys Tag Along knows nothing about, and a default that
collides with one of yours is worse than no default. Pick your own in Settings
→ Hotkeys.
