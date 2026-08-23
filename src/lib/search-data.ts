import { getCollection } from 'astro:content';
import { COLLECTIONS } from './collections';
import { calculateReadingTime, type ArticleMeta } from './articles';

export type ArticleCollectionId = 'docs' | 'blog' | 'research' | 'specs' | 'wiki';
const COLLECTION_IDS = COLLECTIONS.map((c) => c.id) as ArticleCollectionId[];

export interface SearchDoc extends ArticleMeta {
	text: string;
}

let cache: Promise<SearchDoc[]> | undefined;

/** Full-text search documents for the command palette, built at build time. */
export function getSearchDocs(): Promise<SearchDoc[]> {
	cache ??= (async () => {
		const groups = await Promise.all(
			COLLECTION_IDS.map((id) => getCollection(id, ({ data }) => !data.draft))
		);
		return groups.flat().map((entry) => {
			const body = (entry.body ?? '').toLowerCase();
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
				text: [
					entry.data.title,
					entry.data.category ?? '',
					entry.collection,
					entry.data.date?.toISOString().slice(0, 10) ?? '',
					(entry.data.tags ?? []).join(' '),
					body,
				]
					.join(' ')
					.toLowerCase(),
			};
		});
	})();
	return cache;
}
