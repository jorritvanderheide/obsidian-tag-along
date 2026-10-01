# Settings

All settings live in `src/settings.ts`: the shape (`TagAlongSettings`), the
defaults, and the code that checks and upgrades them.

## One way in

Every value that reaches the settings goes through `migrateSettings`, whether it
comes from `data.json` at startup, from a sync service, or from the settings
tab and menus through `applySettingsChange`. That function:

- upgrades older data step by step (see below),
- drops values of the wrong type and falls back to the default,
- normalises tags (lower case, no `#`, no surrounding `/`) and removes
  duplicates,
- keeps only sub-tags in **Top-level folders** and only top-level tags in
  **Filter-only folders**,
- makes sure a folder is never both first in **Folder order** and pinned to the
  bottom.

So the UI can pass raw input, and nothing else needs to check it.

## Tags are stored as written in notes

Folder settings (order, pinned, flat, exclusive, icons) store the tag *as
written in notes*, not as it is shown in the tree. A sub-tag moved to the top
level is stored as `foo/bar`, not `bar`. `TagMap.shownTags` translates them when
the tree is built. See [Tree model](tree-model.md#3-moved-hidden-and-exclusive-tags).

## Versions and migrations

`SETTINGS_VERSION` is the current shape. Each step in `upgrades` turns data of
version `n` into version `n + 1`:

| From | What changed |
| --- | --- |
| 1 (1.x, no `version`) | Settings renamed to their 2.0 names. Removed 1.x options are dropped. |
| 2 | Pinning split in two: sub-tags moved to the top level, and the folder order. |
| 3 | The folder order went by the name a folder was shown with; it now goes by the tag it comes from. |

Data from a newer version is read as the current one, keeping the settings it
knows. That lets an older Tag Along open a vault synced from a newer one without
losing settings it understands.

## Changing the shape

Settings written by a released version exist in other people's vaults. When you
rename, remove or change the meaning of a stored setting:

1. Bump `SETTINGS_VERSION`.
2. Add a step to `upgrades` that turns the previous shape into the new one.
3. Add a test in `tests/settings.test.ts` that feeds it stored data of the old
   shape.

Adding a new setting with a default doesn't need a migration.

## Folder paths

**Included folders** and **Excluded folders** are vault paths. On startup,
`fixFolderCase` corrects their case to match the vault, and when a folder is
renamed, `renameFolderPaths` updates them, so they keep pointing at the right
place.
