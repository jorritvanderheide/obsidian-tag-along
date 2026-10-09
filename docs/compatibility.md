# Compatibility

Tag Along's settings live in other people's vaults, often synced to devices
that update at different times, and people bind hotkeys to its commands. This
page says what a release may and may not change. Changes are listed in
[CHANGELOG.md](../CHANGELOG.md).

Tag Along's version is `MAJOR.MINOR.PATCH`. A minor or patch release breaks
nothing below. A major release may, and the changelog then says what changed
and what to do.

## Settings

Settings are in `data.json` in the plugin folder. Their shape, the defaults and
the upgrades are in `src/settings.ts`, described in [Settings](settings.md).

- **Renaming or removing a key, or changing what a value means,** needs a new
  `SETTINGS_VERSION`, a step in `upgrades` that rewrites the old value, and a
  test that loads the old shape. See
  [Changing the shape](settings.md#changing-the-shape).
- **A rule in [Tree model](tree-model.md)** that a setting depends on counts
  too: if the same setting gives another tree, its meaning changed.
- **Folder settings store tags as written in notes,** normalised. Changing
  that, or how tags are normalised, changes what every stored folder setting
  points at, so it needs a step too. See
  [Tags are stored as written in notes](settings.md#tags-are-stored-as-written-in-notes).
- **Sort orders are stored by name,** such as `name-asc`. Renaming or removing
  one needs a step too; adding one doesn't. A release reads a sort it doesn't
  know as the default.
- **1.x settings,** from Tag Explorer before the rewrite, have no `version`.
  `fromVersion1` maps them onto 2.0's names, and every step after it runs too.
  It stays.
- **Adding a setting** with a default is not breaking and needs no step.
- **Changing a default** is not breaking, but goes in the changelog: saved
  settings hold every value, so it only changes the tree for people who never
  changed a setting.
- **A value of the wrong type** gets its default. It never stops the plugin
  from loading.

`tests/settings.test.ts` has the `data.json` of released versions, named after
the version. Add one whenever the stored shape changes.

Going back to an older release, or syncing with a device that has one, works:
it reads settings from a newer version as its own and keeps the ones it knows.
When it saves, it drops the rest.

## Open folders

Which folders are open is stored per pane in Obsidian's workspace layout, by
[key](tree-model.md#keys). Changing how keys are made isn't breaking, but closes
everyone's folders once, so the changelog says so.

## Notes

To build the tree, Tag Along reads each note's tags, its `title` property, its
first heading, its file name and folder, and its modified and created times,
all through Obsidian.

It changes files only when you rename, copy, move or delete a note. Renaming
changes the first heading and `title` property when they showed the old name,
and the file name when the file was named after it. It never writes a tag.
Changing a note in any other way is breaking, and goes in the README's
disclosure and `SECURITY.md` in the same change.

## Names

- **The plugin id** `tag-along` never changes. It's the plugin's folder, where
  `data.json` is, and the start of every command ID. 2.2.0 changed it from
  `tag-explorer`, and Obsidian installed Tag Along as a new plugin, without
  settings or hotkeys.
- **Command IDs** (`tag-along:open`, `tag-along:reveal-active-note`, ...) are
  what hotkeys are bound to. Renaming or removing one is breaking. A command's
  name can change; adding one is not breaking. Commands ship unbound.
- **The view type** `tag-along-view` is how the workspace layout finds the pane,
  and how Page preview knows previews come from Tag Along. Renaming it loses
  both.
- **URIs:** Tag Along has no `obsidian://` actions. If it gets one, its name and
  parameters belong in this list.

## Obsidian and devices

- **`minAppVersion`** in `manifest.json` is the oldest Obsidian a release runs
  on. `versions.json` keeps it for every release, so Obsidian offers people with
  an older Obsidian the last release that runs there. Raising it is not breaking,
  but goes in the changelog. Never change or remove an entry in `versions.json`.
- **Mobile:** Tag Along runs on phones and tablets (`isDesktopOnly` is `false`).
  Making it desktop-only, or using Node or Electron APIs, is breaking.

## Not covered

These can change in any release, and the changelog says when they do:

- How the tree looks, and its CSS classes, so a CSS snippet may need updating.
- The wording of menus, notices and the settings tab.
- The code: Tag Along has no API for other plugins.
