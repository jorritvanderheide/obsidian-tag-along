import type { NoteEntry } from '../src/core/tags';

const NAMESPACES = ['domain', 'source', 'status', 'type', 'project', 'person', 'area', 'topic'];

/** Small seeded random generator, so every run uses the same notes. */
function random(seed: number): () => number {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Fake notes for benchmarks: `count` notes with 3 to 6 tags each, in eight namespaces, up to three
 * levels deep with ten values per level.
 */
export function generateNotes(count: number, seed = 1): NoteEntry[] {
	const next = random(seed);
	const pick = (n: number) => Math.floor(next() * n);
	const notes: NoteEntry[] = [];
	for (let i = 0; i < count; i++) {
		const tags: string[] = [];
		const tagCount = 3 + pick(4);
		for (let t = 0; t < tagCount; t++) {
			const depth = 1 + pick(3);
			const parts = [NAMESPACES[pick(NAMESPACES.length)] ?? 'domain'];
			for (let d = 0; d < depth; d++) parts.push(`value-${pick(10)}`);
			tags.push(parts.join('/'));
		}
		notes.push({ path: `Notes/Note ${i}.md`, name: `Note ${i}`, mtime: i, ctime: i, tags });
	}
	return notes;
}
