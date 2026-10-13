import { getCollection } from 'astro:content';
import { COLLECTIONS } from './collections';

/** Every collection id, as a literal union for Astro's typed helpers. */
export type ArticleCollectionId = string;
export type ArticleEntry = any;

const COLLECTION_IDS = COLLECTIONS.map((c) => c.id);

const WIKILINK = /\[\[([^\]|\n]+)(?:\|[^\]\n]*)?\]\]/g;

export interface ReadingTime {
	words: number;
	minutes: number;
}

/** Ported from calculateReadingTime() in the reference project. */
export function calculateReadingTime(body: string): ReadingTime {
	const cleanText = body
		.replace(/```[\s\S]*?```/g, '')
		.replace(/[#*`_~[\]()]/g, ' ')
		.trim();
	const words = cleanText ? cleanText.split(/\s+/).length : 0;
	const minutes = Math.ceil(words / 200) || 1;
	return { words, minutes };
}

/** Serialized article metadata handed to client-side islands. */
export interface ArticleMeta {
	slug: string;
	url: string;
	collection: string;
	title: string;
	category?: string;
	tags: string[];
	date?: string;
	author?: string;
	summary?: string;
	readingTime: ReadingTime;
}

function toMeta(entry: ArticleEntry): ArticleMeta {
	return {
		slug: entry.id,
		url: `/${entry.id}`,
		collection: entry.collection,
		title: entry.data.title,
		category: entry.data.category,
		tags: entry.data.tags ?? [],
		date: entry.data.date ? entry.data.date.toISOString().slice(0, 10) : undefined,
		author: entry.data.author,
		summary: entry.data.summary,
		readingTime: calculateReadingTime(entry.body ?? ''),
	};
}

let indexCache: Promise<ArticleMeta[]> | undefined;

/**
 * Flattened metadata for every non-draft article across all collections.
 * Small enough (KBs) to embed into client islands.
 */
export function getArticleIndex(): Promise<ArticleMeta[]> {
	indexCache ??= (async () => {
		const groups = await Promise.all(
			COLLECTION_IDS.map(async (id) => {
				const entries = await (getCollection as any)(id, ({ data }: any) => !data.draft);
				return entries.map(toMeta);
			})
		);
		return groups.flat();
	})();
	return indexCache;
}

export async function getCollectionArticles(collectionId: string): Promise<ArticleMeta[]> {
	const index = await getArticleIndex();
	return index.filter((a) => a.collection === collectionId);
}

/**
 * Resolve a short wikilink reference ("quantum-computing") against the full
 * article list by exact or suffix slug match - same matching rules as the
 * reference app.
 */
export function resolveArticleRef(index: ArticleMeta[], ref: string): ArticleMeta | undefined {
	const clean = ref.trim().toLowerCase().replace(/^\/+/, '').replace(/\.(md|mdx)$/, '');
	if (!clean) return undefined;
	return (
		index.find((a) => a.slug.toLowerCase() === clean) ??
		index.find((a) => a.slug.toLowerCase().endsWith(`/${clean}`)) ??
		index.find((a) => a.slug.toLowerCase().endsWith(clean))
	);
}

export interface Backlink {
	slug: string;
	title: string;
	summary?: string;
}

let backlinkCache: Promise<Map<string, Backlink[]>> | undefined;

/**
 * Map of article slug -> articles that link to it via [[wikilinks]] in their
 * markdown source, across every collection.
 */
export function getBacklinkMap(): Promise<Map<string, Backlink[]>> {
	backlinkCache ??= (async () => {
		const [index, groups] = await Promise.all([
			getArticleIndex(),
			Promise.all(COLLECTION_IDS.map((id) => (getCollection as any)(id))),
		]);
		const map = new Map<string, Backlink[]>();

		for (const group of groups) {
			for (const doc of group) {
				if (!doc.body) continue;
				const seen = new Set<string>();
				for (const match of doc.body.matchAll(WIKILINK)) {
					const target = normalizeTarget(match[1]);
					if (!target || seen.has(target)) continue;
					seen.add(target);

					const resolved = resolveArticleRef(index, target);
					if (!resolved || resolved.slug === doc.id) continue;
					const list = map.get(resolved.slug) ?? [];
					if (!list.some((b) => b.slug === doc.id)) {
						list.push({ slug: doc.id, title: doc.data.title, summary: doc.data.summary });
						map.set(resolved.slug, list);
					}
				}
			}
		}

		return map;
	})();
	return backlinkCache;
}

export async function getBacklinks(slug: string): Promise<Backlink[]> {
	const map = await getBacklinkMap();
	return map.get(slug.toLowerCase()) ?? [];
}

function normalizeTarget(raw: string): string {
	return raw
		.trim()
		.toLowerCase()
		.replace(/^\/+/, '')
		.replace(/\.(md|mdx)$/, '')
		.split('#')[0];
}
