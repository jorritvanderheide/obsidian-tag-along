import { describe, expect, it } from 'vitest';
import type { NoteEntry } from '../src/core/tags';
import { type Children, type FolderNode, isInsideFolder, TagTree, type TreeOptions } from '../src/core/tree';

const defaults: TreeOptions = {
	compactFolders: false,
	filterFolders: false,
	showUntagged: false,
	hiddenFolders: [],
	topLevelFolders: [],
	folderOrder: [],
	noteSort: 'name-asc',
	folderSort: 'name-asc',
};

function note(name: string, ...tags: string[]): NoteEntry {
	return { path: `${name}.md`, name, mtime: 0, ctime: 0, tags };
}

function tree(notes: NoteEntry[], options: Partial<TreeOptions> = {}): TagTree {
	return new TagTree(notes, { ...defaults, ...options });
}

/** Renders children as a compact outline: folders as `label/`, filters as `~label`, notes by name. */
function outline(t: TagTree, children: Children, depth = Infinity): string[] {
	const lines: string[] = [];
	const walk = (c: Children, indent: string, level: number) => {
		const folder = (node: FolderNode, prefix: string) => {
			lines.push(`${indent}${prefix}${node.label}/`);
			if (level < depth) walk(t.children(node), indent + '  ', level + 1);
		};
		c.folders.forEach((node) => folder(node, ''));
		c.notes.forEach((n) => lines.push(`${indent}${n.name}`));
		c.filters.forEach((node) => folder(node, '~'));
	};
	walk(children, '', 1);
	return lines;
}

const meeting = note('Meeting notes', 'domain/work', 'status/active');
const research = note('Research doc', 'domain/coding', 'source/book', 'status/active');
const summary = note('Book summary', 'source/book', 'status/done');
const readme = [meeting, research, summary];

/** The `source/book` folder, found without relying on compaction. */
function sourceBook(t: TagTree): FolderNode | undefined {
	const source = t.root().folders.find((f) => f.label === 'source');
	return source && t.children(source).folders.find((f) => f.label === 'book');
}

describe('TagTree', () => {
	it('shows each namespace as its own tree, with a note under every tag it has', () => {
		const t = tree(readme);
		expect(outline(t, t.root())).toEqual([
			'domain/',
			'  coding/',
			'    Research doc',
			'  work/',
			'    Meeting notes',
			'source/',
			'  book/',
			'    Book summary',
			'    Research doc',
			'status/',
			'  active/',
			'    Meeting notes',
			'    Research doc',
			'  done/',
			'    Book summary',
		]);
	});

	it('computes the top level once and keeps folder contents between calls', () => {
		const t = tree(readme);
		const first = t.root();
		const domain = first.folders[0]!;
		const children = t.children(domain);
		expect(t.root()).toBe(first);
		expect(t.children(t.root().folders[0]!)).toBe(children);
	});

	it('shows a note only in the deepest folder of a namespace', () => {
		const t = tree([note('A', 'domain', 'domain/coding'), note('B', 'domain')]);
		expect(outline(t, t.root())).toEqual(['domain/', '  coding/', '    A', '  B']);
	});

	it('matches tags case-insensitively and keeps the first spelling', () => {
		const t = tree([note('A', 'Domain/Coding'), note('B', 'domain/coding')]);
		expect(outline(t, t.root())).toEqual(['Domain/', '  Coding/', '    A', '    B']);
	});

	it('hides untagged notes unless enabled', () => {
		const notes = [note('A', 'x'), note('Loose')];
		expect(outline(tree(notes), tree(notes).root(), 1)).toEqual(['x/']);
		const t = tree(notes, { showUntagged: true });
		expect(outline(t, t.root(), 1)).toEqual(['x/', 'Loose']);
	});

	describe('hidden folders', () => {
		const notes = [note('A', 'foo/bar', 'qux/quux'), note('B', 'qux/quux'), note('C', 'Qux/corge')];

		it('shows no folder for them, but keeps their notes under other tags', () => {
			const t = tree(notes, { hiddenFolders: ['qux'] });
			expect(outline(t, t.root())).toEqual(['foo/', '  bar/', '    A']);
		});

		it('lists notes left without tags as untagged when that is enabled', () => {
			const t = tree(notes, { hiddenFolders: ['qux'], showUntagged: true });
			expect(outline(t, t.root(), 1)).toEqual(['foo/', 'B', 'C']);
		});

		it('hides a sub-tag and its sub-tags, keeping the rest of the namespace', () => {
			const t = tree([note('A', 'foo/bar/baz'), note('B', 'foo/bar'), note('C', 'foo/qux'), note('D', 'foo/barn')], {
				hiddenFolders: ['foo/bar'],
			});
			expect(outline(t, t.root())).toEqual(['foo/', '  barn/', '    D', '  qux/', '    C']);
		});

		it('does not offer them as filter folders', () => {
			const withFilter = [note('A', 'foo', 'qux/1'), note('B', 'foo', 'qux/2')];
			const t = tree(withFilter, { hiddenFolders: ['qux'], filterFolders: true });
			const foo = t.root().folders[0];
			expect(foo && t.children(foo).filters).toEqual([]);
		});
	});

	describe('folder order', () => {
		it('puts the folders ordered by hand first, in that order', () => {
			const notes = [note('A', 'aa'), note('B', 'bb'), note('C', 'cc'), note('D', 'dd')];
			const t = tree(notes, { folderOrder: ['dd', 'bb'] });
			expect(t.root().folders.map((f) => f.label)).toEqual(['dd', 'bb', 'aa', 'cc']);
		});

		it('keeps them first under any sort order', () => {
			const notes = [note('A', 'aa'), note('B', 'bb'), note('C', 'bb'), note('D', 'cc')];
			const t = tree(notes, { folderOrder: ['cc'], folderSort: 'count-desc' });
			expect(t.root().folders.map((f) => f.label)).toEqual(['cc', 'bb', 'aa']);
		});

		it('orders sub-folders among their own siblings', () => {
			const notes = [note('A', 'foo/aa'), note('B', 'foo/bb'), note('C', 'foo/cc')];
			const t = tree(notes, { folderOrder: ['foo/cc'] });
			const foo = t.root().folders[0];
			expect(foo && t.children(foo).folders.map((f) => f.label)).toEqual(['cc', 'aa', 'bb']);
		});

		it('leaves filter folders to the sort order', () => {
			const notes = [note('A', 'qux', 'aa/1', 'bb/1'), note('B', 'qux', 'aa/2', 'bb/2'), note('C', 'qux')];
			const t = tree(notes, { folderOrder: ['bb'], filterFolders: true });
			const qux = t.root().folders.find((f) => f.label === 'qux');
			expect(qux && t.children(qux).filters.map((f) => f.label)).toEqual(['aa', 'bb']);
		});
	});

	describe('top-level folders', () => {
		it('moves the tag out of its parent into its own top-level folder', () => {
			const notes = [note('A', 'foo/bar'), note('B', 'foo/bar/baz'), note('C', 'foo/qux')];
			const t = tree(notes, { topLevelFolders: ['foo/bar'] });
			expect(outline(t, t.root())).toEqual(['bar/', '  baz/', '    B', '  A', 'foo/', '  qux/', '    C']);
		});

		it('merges with a namespace of the same name', () => {
			const t = tree([note('A', 'foo/bar/x'), note('B', 'Bar/y')], { topLevelFolders: ['foo/bar'] });
			expect(outline(t, t.root())).toEqual(['bar/', '  x/', '    A', '  y/', '    B']);
		});

		it('uses the deepest moved tag when moved tags are nested', () => {
			const t = tree([note('A', 'foo/bar/baz/x')], { topLevelFolders: ['foo/bar', 'foo/bar/baz'] });
			expect(outline(t, t.root())).toEqual(['baz/', '  x/', '    A']);
		});

		it('is not hidden along with its old namespace', () => {
			const t = tree([note('A', 'foo/bar'), note('B', 'foo/qux')], {
				topLevelFolders: ['foo/bar'],
				hiddenFolders: ['foo'],
			});
			expect(outline(t, t.root())).toEqual(['bar/', '  A']);
		});

		it('is not offered as a filter folder', () => {
			const notes = [
				note('A', 'qux', 'foo/bar/1', 'corge/1'),
				note('B', 'qux', 'foo/bar/2'),
				note('C', 'qux', 'corge/1'),
			];
			const t = tree(notes, { topLevelFolders: ['foo/bar'], filterFolders: true });
			const qux = t.root().folders.find((f) => f.label === 'qux');
			expect(qux && t.children(qux).filters.map((f) => f.label)).toEqual(['corge']);
		});

		it('is hidden when the moved tag itself is hidden, by either name', () => {
			const notes = [note('A', 'foo/bar/x'), note('B', 'foo/bar/y'), note('C', 'foo/qux')];
			for (const hidden of ['foo/bar', 'bar']) {
				const t = tree(notes, { topLevelFolders: ['foo/bar'], hiddenFolders: [hidden] });
				expect(outline(t, t.root(), 1), hidden).toEqual(['foo/']);
			}
			for (const hidden of ['foo/bar/x', 'bar/x']) {
				const t = tree(notes, { topLevelFolders: ['foo/bar'], hiddenFolders: [hidden] });
				expect(outline(t, t.root(), 2), hidden).toEqual(['bar/', '  y/', 'foo/', '  qux/']);
			}
		});

	});

	describe('source tags', () => {
		it('lists the tags a folder stands for, deepest first, as they are written in notes', () => {
			const t = tree([note('A', 'foo/bar/baz')], { compactFolders: true, topLevelFolders: ['foo/bar'] });
			const bar = t.root().folders[0];
			expect(bar?.label).toBe('bar/baz');
			expect(bar && t.sourceTags(bar)).toEqual(['foo/bar/baz', 'foo/bar']);
		});

		it('uses the shown tag when a folder merges several sources', () => {
			const t = tree([note('A', 'foo/bar'), note('B', 'bar')], { topLevelFolders: ['foo/bar'] });
			const bar = t.root().folders[0];
			expect(bar && t.sourceTags(bar)).toEqual(['bar']);
		});
	});

	describe('tags on the path', () => {
		it('collects the deepest tag per namespace on the way to a folder, as written', () => {
			const t = tree([note('A', 'Source/Book', 'status/Active'), note('B', 'source/book', 'status/done')], {
				filterFolders: true,
			});
			const source = t.root().folders.find((f) => f.label === 'Source')!;
			const book = t.children(source).folders[0]!;
			const status = t.children(book).filters[0]!;
			const active = t.children(status).folders.find((f) => f.label === 'Active')!;
			expect(t.pathTags(book)).toEqual(['Source/Book']);
			expect(t.pathTags(status)).toEqual(['Source/Book']);
			expect(t.pathTags(active)).toEqual(['Source/Book', 'status/Active']);
		});

		it('uses the tag as written in notes for moved sub-tags', () => {
			const t = tree([note('A', 'Foo/Bar/x')], { topLevelFolders: ['foo/bar'] });
			const bar = t.root().folders[0]!;
			const x = t.children(bar).folders[0]!;
			expect(t.pathTags(x)).toEqual(['Foo/Bar/x']);
		});
	});

	describe('finding folders', () => {
		const labels = (nodes: FolderNode[] | undefined) => nodes?.map((n) => n.label);

		it('finds the way to the folder of a tag, as written in notes', () => {
			const t = tree([note('A', 'foo/bar/baz'), note('B', 'foo/qux')]);
			expect(labels(t.pathToTag('Foo/Bar'))).toEqual(['foo', 'bar']);
			expect(labels(t.pathToTag('#foo/bar/baz'))).toEqual(['foo', 'bar', 'baz']);
			expect(t.pathToTag('nope')).toBeUndefined();
		});

		it('follows compact folders, moved and hidden folders', () => {
			const t = tree([note('A', 'foo/bar/baz'), note('B', 'foo/bar/qux'), note('C', 'corge/x')], {
				compactFolders: true,
				topLevelFolders: ['foo/bar'],
				hiddenFolders: ['corge'],
			});
			expect(labels(t.pathToTag('foo/bar/baz'))).toEqual(['bar', 'baz']);
			expect(labels(t.pathToTag('foo/bar'))).toEqual(['bar']);
			expect(t.pathToTag('corge/x')).toBeUndefined();
		});

		it('finds the folder that lists a note, in the first namespace shown', () => {
			const t = tree([note('A', 'zed/1', 'foo', 'foo/bar'), note('B', 'foo/qux')]);
			expect(labels(t.pathToNote('A.md'))).toEqual(['foo', 'bar']);
			expect(t.pathToNote('missing.md')).toBeUndefined();
		});
	});

	describe('compact folders', () => {
		it('merges a folder with its only sub-folder', () => {
			const t = tree([note('A', 'domain/coding/git'), note('B', 'domain/coding/git')], {
				compactFolders: true,
			});
			expect(outline(t, t.root())).toEqual(['domain/coding/git/', '  A', '  B']);
		});

		it('stops merging where a folder has siblings or notes of its own', () => {
			const t = tree([note('A', 'domain/coding/git'), note('B', 'domain/coding/rust'), note('C', 'domain/coding')], {
				compactFolders: true,
			});
			expect(outline(t, t.root())).toEqual(['domain/coding/', '  git/', '    A', '  rust/', '    B', '  C']);
		});

		it('marks top-level folders and knows which folders are inside which', () => {
			const t = tree([note('A', 'foo/bar/baz'), note('B', 'foo/qux')]);
			const foo = t.root().folders[0]!;
			const bar = t.children(foo).folders[0]!;
			const baz = t.children(bar).folders[0]!;
			expect([foo.isTopLevel, bar.isTopLevel, baz.isTopLevel]).toEqual([true, false, false]);
			expect(isInsideFolder(baz.key, foo.key)).toBe(true);
			expect(isInsideFolder(foo.key, baz.key)).toBe(false);
			expect(isInsideFolder(foo.key, foo.key)).toBe(false);
		});

		it('keeps the key of the outermost folder so expanded state survives', () => {
			const compact = tree([note('A', 'domain/coding')], { compactFolders: true }).root().folders[0];
			const plain = tree([note('A', 'domain/coding')]).root().folders[0];
			expect(compact?.key).toBe(plain?.key);
			expect(compact?.chain).toEqual(['domain', 'domain/coding']);
		});
	});

	describe('filter folders', () => {
		it('offers other namespaces after the notes when they narrow the folder down', () => {
			const t = tree(readme, { filterFolders: true });
			const source = t.root().folders.find((f) => f.label === 'source');
			const book = source && t.children(source).folders[0];
			expect(book && outline(t, t.children(book))).toEqual([
				'Book summary',
				'Research doc',
				'~status/',
				'  active/',
				'    Research doc',
				'  done/',
				'    Book summary',
			]);
		});

		it('skips namespaces where every tag is on every note', () => {
			const notes = ['A', 'B', 'C'].map((name) => note(name, 'source/book', 'status/done', 'status/review'));
			const t = tree(notes, { filterFolders: true });
			const book = sourceBook(t);
			expect(book && t.children(book).filters).toEqual([]);
		});

		it('offers namespaces that only some notes have', () => {
			const notes = [note('A', 'source/book', 'domain/x'), note('B', 'source/book', 'domain/x'), note('C', 'source/book')];
			const t = tree(notes, { filterFolders: true });
			const book = sourceBook(t);
			expect(book && t.children(book).filters.map((f) => f.label)).toEqual(['domain']);
		});

		it('skips namespaces that would leave a single note', () => {
			const t = tree([note('A', 'source/book', 'domain/x'), note('B', 'source/book')], { filterFolders: true });
			const book = sourceBook(t);
			expect(book && t.children(book).filters).toEqual([]);
		});

		it('only narrows the notes shown directly in the folder, not those in sub-folders', () => {
			const notes = [
				note('Foo 1', 'foo/bar', 'qux/quux'),
				note('Foo 2', 'foo/bar', 'qux/quux'),
				note('Foo 3', 'foo/bar', 'qux/quux'),
				note('Baz 1', 'foo/bar/baz'),
				note('Baz 2', 'foo/bar/baz'),
			];
			const t = tree(notes, { filterFolders: true, compactFolders: true });
			const bar = t.root().folders.find((f) => f.label === 'foo/bar');
			expect(bar && t.children(bar).filters).toEqual([]);
		});

		it('offers namespaces whose deeper tags split the notes', () => {
			const t = tree([note('A', 'source/book', 'status/done/x'), note('B', 'source/book', 'status/done')], {
				filterFolders: true,
			});
			const book = sourceBook(t);
			expect(book && t.children(book).filters.map((f) => f.label)).toEqual(['status']);
		});

		it('chains filters, offering each namespace only once', () => {
			const notes = [
				note('A', 'a/1', 'b/1', 'c/1'),
				note('B', 'a/1', 'b/1', 'c/2'),
				note('C', 'a/1', 'b/2', 'c/1'),
			];
			const t = tree(notes, { filterFolders: true, compactFolders: true });
			const a = t.root().folders[0];
			expect(a && t.children(a).filters.map((f) => f.label)).toEqual(['b', 'c']);
			const b = a && t.children(a).filters.find((f) => f.label === 'b');
			const b1 = b && t.children(b).folders.find((f) => f.label === '1');
			// Inside a > b > 1 only c is left; a and b were already used.
			expect(b1 && t.children(b1).filters.map((f) => f.label)).toEqual(['c']);
		});

		it('is off unless enabled', () => {
			const t = tree(readme);
			const book = t.root().folders.find((f) => f.label === 'source');
			expect(book && t.children(t.children(book).folders[0]!).filters).toEqual([]);
		});
	});
});
