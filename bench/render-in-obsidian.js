// Measures drawing the fully expanded tree for 20,000 generated notes inside a running Obsidian.
// Nothing is written to the vault: the tree is drawn into an element that is never attached.
// Run with: obsidian eval code="$(cat bench/render-in-obsidian.js)"
(async () => {
	const count = 20000;
	const namespaces = ['domain', 'source', 'status', 'type', 'project', 'person', 'area', 'topic'];
	let seed = 1;
	const next = () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const pick = (n) => Math.floor(next() * n);
	const notes = [];
	for (let i = 0; i < count; i++) {
		const tags = [];
		const tagCount = 3 + pick(4);
		for (let t = 0; t < tagCount; t++) {
			const parts = [namespaces[pick(namespaces.length)]];
			for (let d = 0, depth = 1 + pick(3); d < depth; d++) parts.push(`value-${pick(10)}`);
			tags.push(parts.join('/'));
		}
		notes.push({ path: `Notes/Note ${i}.md`, name: `Note ${i}`, mtime: i, ctime: i, tags });
	}

	const plugin = app.plugins.plugins['tag-along'];
	const view = app.workspace.getLeavesOfType('tag-along-view')[0]?.view;
	if (!plugin || !view) return 'Open Tag Along first.';
	const TagTree = plugin.tree().constructor;
	const TreeRenderer = view.renderer.constructor;
	const options = { ...plugin.settings, hiddenFolders: [], topLevelFolders: [], folderOrder: [] };

	const results = {};
	for (const filterFolders of [true, false]) {
		const tree = new TagTree(notes, { ...options, filterFolders });
		const expanded = new Set();
		const walk = (folders) => {
			for (const node of folders) {
				expanded.add(node.key);
				walk(tree.children(node).folders);
			}
		};
		walk(tree.root().folders);
		const rootEl = createDiv();
		const renderer = new TreeRenderer(rootEl, {
			isExpanded: (key) => expanded.has(key),
			activePath: () => null,
			isSelected: () => false,
			showNoteCount: () => true,
			iconFor: () => undefined,
		});
		const start = performance.now();
		renderer.render(tree);
		results[filterFolders ? 'withFilterFolders' : 'withoutFilterFolders'] = {
			drawMs: Math.round(performance.now() - start),
			rows: rootEl.querySelectorAll('.tree-item-self').length,
		};
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	return JSON.stringify(results);
})();
