import { getCollection } from 'astro:content';
import { COLLECTIONS } from './collections';
import { resolveEntryTitle } from './title';

export interface GraphNodeJSON {
	id: string;
	name: string;
	type: 'article' | 'category' | 'tag';
	collection?: string;
	url?: string;
	val: number;
}

export interface GraphLinkJSON {
	source: string;
	target: string;
	type: 'explicit-link' | 'tag' | 'category';
}

export interface GraphJSON {
	nodes: GraphNodeJSON[];
	links: GraphLinkJSON[];
}

const WIKILINK = /\[\[([^\]|\n]+)(?:\|[^\]\n]*)?\]\]/g;

/**
 * URL-safe slug shared by the graph builder and the /tags & /categories pages
 * so graph node URLs always match the generated static routes.
 */
import { taxonomySlug } from './slugs';
export { taxonomySlug };

function normalizeTarget(raw: string): string {
	return raw
		.trim()
		.toLowerCase()
		.replace(/^\/+/, '')
		.replace(/\.(md|mdx)$/, '')
		.split('#')[0];
}

function suffixResolve(target: string, slugs: Map<string, string>): string | undefined {
	if (slugs.has(target)) return slugs.get(target);
	for (const [slug, id] of slugs) {
		if (slug.endsWith(`/${target}`) || slug.endsWith(target)) return id;
	}
	return undefined;
}

/**
 * Build the full knowledge graph (articles, categories, tags, explicit
 * `[[wikilinks]]`) from every article collection at build time.
 * Ported from the reference project's GraphBrowser node/link construction.
 */
export async function getGraphData(): Promise<GraphJSON> {
	const groups = await Promise.all(
		COLLECTIONS.map(async ({ id }) => ({
			id,
			entries: await (getCollection as any)(id, ({ data }: any) => !data.draft),
		}))
	);

	const nodes: GraphNodeJSON[] = [];
	const links: GraphLinkJSON[] = [];
	const nodeIds = new Set<string>();
	const slugToId = new Map<string, string>();

	for (const { entries } of groups) {
		for (const doc of entries) {
			slugToId.set(doc.id.toLowerCase(), doc.id);
			// Also index the last path segment so short wikilinks resolve.
			const last = doc.id.toLowerCase().split('/').pop();
			if (last && !slugToId.has(last)) slugToId.set(last, doc.id);
		}
	}

	for (const { id, entries } of groups) {
		for (const doc of entries) {
			nodes.push({
				id: doc.id,
				name: resolveEntryTitle(doc),
				type: 'article',
				collection: id,
				url: `/${doc.id}`,
				val: 10,
			});
			nodeIds.add(doc.id);

			if (doc.data.category) {
				const catId = `cat:${doc.data.category.toLowerCase()}`;
				if (!nodeIds.has(catId)) {
					nodes.push({
						id: catId,
						name: doc.data.category,
						type: 'category',
						val: 14,
						url: `/categories/${taxonomySlug(doc.data.category)}`,
					});
					nodeIds.add(catId);
				}
				links.push({ source: doc.id, target: catId, type: 'category' });
			}

			for (const tag of doc.data.tags ?? []) {
				const tagId = `tag:${tag.toLowerCase()}`;
				if (!nodeIds.has(tagId)) {
					nodes.push({
						id: tagId,
						name: `#${tag}`,
						type: 'tag',
						val: 6,
						url: `/tags/${taxonomySlug(tag)}`,
					});
					nodeIds.add(tagId);
				}
				links.push({ source: doc.id, target: tagId, type: 'tag' });
			}
		}
	}

	for (const { entries } of groups) {
		for (const doc of entries) {
			if (!doc.body) continue;
			for (const match of doc.body.matchAll(WIKILINK)) {
				const target = suffixResolve(normalizeTarget(match[1]), slugToId);
				if (target && target !== doc.id && nodeIds.has(target)) {
					links.push({ source: doc.id, target, type: 'explicit-link' });
				}
			}
		}
	}

	return { nodes, links };
}

let graphCache: Promise<GraphJSON> | undefined;

/** Cached full graph, shared by the /graph page and per-article subgraphs. */
export function getCachedGraph(): Promise<GraphJSON> {
	graphCache ??= getGraphData();
	return graphCache;
}

const subgraphCache = new Map<string, GraphJSON>();

/**
 * Build the local sub-graph for one article: the article node plus everything
 * directly connected to it (linked articles, its category, its tags).
 */
export async function getSubgraph(slug: string): Promise<GraphJSON> {
	const cached = subgraphCache.get(slug);
	if (cached) return cached;

	const { nodes, links } = await getCachedGraph();
	const keep = new Set<string>([slug]);
	for (const link of links) {
		if (link.source === slug) keep.add(link.target);
		if (link.target === slug) keep.add(link.source);
	}

	const result: GraphJSON = {
		nodes: nodes.filter((node) => keep.has(node.id)),
		links: links.filter((link) => keep.has(link.source) && keep.has(link.target)),
	};
	subgraphCache.set(slug, result);
	return result;
}
