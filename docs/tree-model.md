# Tree model

The rules that turn notes and their tags into folders, in the order they are
applied. The code is `src/core/tag-map.ts` (steps 1 to 4) and
`src/core/tree.ts` (steps 5 onwards).

The code and these docs call a tag's top-level part its *namespace*: `domain`
in `domain/coding` (`namespaceOf` in `core/tags.ts`). The README and the FAQ say
"top-level tag" for the same thing, because that's the word users know.

## 1. Which notes are in the tree

`isNoteVisible` in `core/tags.ts`:

- With **Included folders** set, a note has to be in one of them.
- A note in an **Excluded folder** is left out, even inside an included one.
- A note with an **Excluded tag**, or a sub-tag of one, is left out.

## 2. Tags are normalised

A tag is lower-cased, and a leading `#` and surrounding `/` are dropped. Tags
are compared in that form, so `#Book` and `#book` are one folder. A folder's
label is spelled the way the tag is written in the first note that has it.

A note's tags come from Obsidian's `getAllTags`, so tags in the body and in the
`tags` property both count. Duplicates are dropped, ignoring case.

## 3. Moved, hidden and exclusive tags

`TagMap` rewrites each note's tags into the tags it has *in the tree*:

- **Top-level folders.** A tag at or below a moved sub-tag loses its parent:
  with `foo/bar` moved, `foo/bar/x` becomes `bar/x`. When moved sub-tags are
  nested, the deepest one wins. A moved tag merges with a namespace of the same
  name.
- **Hidden folders.** A tag is dropped when a hidden folder covers where it is
  shown, or where it came from. The exception: hiding a parent doesn't hide a
  sub-tag that was moved out of it.
- **Exclusive folders.** When any of a note's tags is in an exclusive folder,
  the note keeps only its exclusive tags and loses the rest.
- Two tags that end up the same, such as `foo/bar` moved next to a plain `bar`,
  are kept once.

Settings that point at folders (order, pinned, flat, exclusive, icons) are
stored as tags *as written in notes*, and translated to where they are shown
with `TagMap.shownTags`. That's why a folder keeps its settings when you move
it to the top level and back.

## 4. Where a note is listed

A note is listed *directly* in a folder when that folder's tag is the deepest of
the note's tags in that branch. A note tagged `#domain` and `#domain/coding` is
listed in `domain/coding`, not in `domain`.

A note with tags in several namespaces is listed in each of them.

## 5. The top level

- Every namespace gets a top-level folder, except **Filter-only folders**.
- A note whose tags are all filter-only has no folder, and counts as untagged.
- With **Show untagged notes** on, untagged notes are listed at the top.

## 6. Inside a folder

`children(node)` splits a folder's notes into:

- **Sub-folders**, one per next level of tag.
- **Notes listed directly**, see step 4.
- **Filter folders**, see step 8.

## 7. Compact and flat folders

- **Compact folders.** While a folder holds no notes of its own and exactly one
  sub-folder, the two are merged into one entry, such as `project/website`. The
  node's `chain` holds every tag merged into it.
- **Flat folders.** A flat folder lists every note below it and shows no
  sub-folders. Compacting stops at a flat folder.

## 8. Filter folders

Filter folders narrow down the notes listed *directly* in a folder, by a
namespace that hasn't been used on the way there (the node's `namespaces`).
Sub-folders already split up the rest.

A filter is only offered when it leaves a real choice:

- the folder lists at least two notes directly,
- at least two of them have a tag in the filter's namespace, and
- some tag in that namespace is missing from at least one note.

Namespaces that a sub-tag was moved into aren't offered as filters. Filter
folders are never flattened, pinned or ordered by hand, and they can be chained.

## 9. Order

Within each level:

1. Folders are sorted by the sort order: name, number of notes, or most
   recently modified note.
2. Then reordered by hand: the folders in **Folder order** first, in that order;
   the ones left alone after them, in sort order; the pinned ones last. The sort
   is stable, which is what keeps the middle group in sort order.

A folder is ordered by its *level tag*, the outermost tag of a compacted chain,
so it keeps its place when compact folders are switched off. Icons and flat
folders go by the deepest tag of the chain.

Notes are sorted by name, modified time or created time. Filter folders only
follow the sort order.

## Keys

Every node has a `key`: its parent's key, a newline, and its tag, with `~` in
front of filter folders. Tags never contain a newline, so keys can't collide.
Open folders are remembered by key, which is why a folder stays open when the
tree is rebuilt.
