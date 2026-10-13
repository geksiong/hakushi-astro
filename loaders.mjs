import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { DEFAULT_COLLECTIONS } from './src/integration/defaults.mjs';

/** Create Hakushi's frontmatter schema, optionally adding project-specific fields. */
export function hakushiSchema({ extend = {} } = {}) {
	return z.object({
		title: z.string(),
		category: z.string().optional(),
		tags: z.array(z.string()).default([]),
		date: z.coerce.date().optional(),
		author: z.string().optional(),
		summary: z.string().optional(),
		draft: z.boolean().default(false),
		...extend,
	});
}

/** Create a glob loader for one Hakushi Markdown collection. */
export function hakushiLoader({ base, pattern = '**/*.md' }) {
	return glob({ base, pattern });
}

/**
 * Create the five default content collections. Individual definitions can be
 * replaced by spreading this result in `src/content.config.ts`.
 */
export function createHakushiCollections({ base = './src/content', schema = hakushiSchema(), collections = DEFAULT_COLLECTIONS } = {}) {
	return Object.fromEntries(collections.map(({ id }) => [
		id,
		defineCollection({ loader: hakushiLoader({ base: `${base}/${id}` }), schema }),
	]));
}
