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

### "This note isn't shown in Tag Along."

You tried to reveal a note that isn't in the tree, for one of the reasons above.

### "#… isn't shown in Tag Along."

You clicked a tag whose folder isn't in the tree, because it's hidden, excluded
or filter-only. Ctrl-click or Cmd-click a tag to search for it instead.

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

Tag Along only offers a filter folder when it narrows something down. It only
looks at the notes listed directly in the folder, because its sub-folders
already split up the rest. At least two of those notes need a tag under that
top-level tag, and they can't all have the same one. A top-level tag you already
used on the way to this folder isn't offered again.

### Two of my tags became one folder

Upper and lower case don't matter, so `#Book` and `#book` end up in the same
folder. A sub-tag you moved to the top level also joins a top-level tag of the
same name. Move `project/reading` to the top level, and it shares one folder
with a plain `reading`.

### I hid a folder, but part of it is still there

A sub-tag you moved to the top level stays visible when you hide its parent,
because it doesn't live there anymore. Move it back into its parent first, from
its right-click menu.

### How do I undo hiding, pinning or flattening a folder?

Most of these are undone from the same right-click menu. A hidden folder isn't
in the tree anymore, so you show it again from **Hidden folders** in the
settings, and a filter-only folder from **Filter-only folders**.

### Can I drag a note onto a folder to tag it?

No. Dragging a folder puts it in your own order. Dragging a note works like in
the core file explorer, so you can drop it in a note to link to it. To tag a
note, edit its tags in the note.

### How do I rename a folder?

A folder is a tag, so you rename the tag in every note that has it. Tag Along
doesn't change tags, but [Tag Wrangler](https://community.obsidian.md/plugins/tag-wrangler)
does. Right-click the tag in Obsidian's Tags view and rename it, along with its
sub-tags. Settings you made for the old folder, like hiding or pinning it, don't
follow the new name, so set them again.

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

### "The note kept its file name, because there's already a file called … next to it."

Another file in the same folder on disk already has that name, so Tag Along left
the file name alone. The heading and the `title` property still got the new
name, if they showed the old one. You can give the file a different name in the
file explorer.

### Does Tag Along change my notes?

Only when you ask for it, by renaming, copying, moving or deleting a note.
Everything you do to folders only changes Tag Along's own settings. See
[section 11 of the README](README.md#11-network-and-file-disclosure).

## Other

### I used TagFolder. What changes?

Your notes don't: both plugins read the same tags, so you can install Tag Along
next to TagFolder and compare. Tag Along started as a fork of TagFolder, and
version 2 is a rewrite with its own settings, so nothing carries over by itself.
If you set TagFolder up, these are the same ideas here:

| In TagFolder | In Tag Along |
| --- | --- |
| Archive tags | **Exclusive folders** |
| Ignore Tag | **Hidden folders** |
| Ignore note Tag | **Excluded tags** |
| Target Folders | **Included folders** |
| Ignore Folders | **Excluded folders** |

The difference you'll notice first is how tags combine. Tag Along shows each
top-level tag as its own tree, and you narrow a folder down with the grey filter
folders inside it. See [Filter folders](README.md#62-filter-folders).

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
