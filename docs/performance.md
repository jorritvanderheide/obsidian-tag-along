# Performance

Tag Along has to stay quick in big vaults, because it redraws whenever a tag
changes. There are two benchmarks, both on the same generated vault: 20,000
notes with three to six tags each, in eight namespaces, up to three levels deep
with ten values per level. The notes come from a seeded generator
(`bench/generate.ts`), so every run uses the same vault.

## Building the tree

```sh
npm run bench
```

Runs `bench/tree.bench.ts` with Vitest. It measures `TagTree` on its own, in
Node, without Obsidian.

Measured on 2026-10-01 on a laptop with an Intel Core i5-1340P:

| Benchmark | Mean |
| --- | --- |
| Build the tree and its top level | 159 ms |
| Expand all folders | 634 ms |
| Expand all folders, without filter folders | 261 ms |

The first number is what opening the pane or changing a tag costs: folders are
only worked out when they're opened. Expanding everything is the worst case,
and filter folders are most of its cost.

## Drawing the tree

`bench/render-in-obsidian.js` measures drawing the fully expanded tree for the
same 20,000 notes inside a running Obsidian. Nothing is written to the vault:
the tree is drawn into an element that is never attached to the page.

```sh
obsidian eval code="$(cat bench/render-in-obsidian.js)"
```

This needs the Obsidian CLI and a vault with Tag Along enabled.

## What keeps it fast

- **One pass to index.** The `TagTree` constructor indexes every tag's notes and
  sub-folders once. Opening a folder is a lookup, not a scan.
- **Lazy folders.** A folder's children, and its filter folders, are only
  computed when it's opened, and then cached.
- **One tree for all panes.** `LastResult` in `main.ts` reuses the tree while
  the notes and settings stay the same.
- **No redraw while typing.** `NoteIndex.update` only reports a change when the
  tags, the display name, or a date that the tree is sorted by has changed.
- **Debounced redraws.** A burst of changes, such as a sync, redraws once.

The grouping loop in `tree.ts` that runs inside filter folders is marked as a
hot path: it avoids allocations, because it runs for every note of every folder
that is shown.

## Before merging a change to `core/tree.ts`

Run `npm run bench` before and after. If the numbers get noticeably worse,
explain why in the commit message.
