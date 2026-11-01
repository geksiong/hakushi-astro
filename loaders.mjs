import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_COLLECTIONS } from './src/integration/defaults.mjs';

/** Create Hakushi's frontmatter schema, optionally adding project-specific fields. */
export function hakushiSchema({ extend = {} } = {}) {
	return z.object({
		title: z.string().optional(),
		category: z.string().optional(),
		mainImage: z.string().optional(),
		tags: z.array(z.string()).default([]),
		date: z.coerce.date().optional(),
		author: z.string().optional(),
		summary: z.string().optional(),
		draft: z.boolean().default(false),
		...extend,
	});
}

/**
 * Create a glob loader for one Hakushi Markdown collection. Unless
 * `folderCategories` is false, a note in a subfolder of `base` that has no frontmatter
 * `category` gets the name of its top-level subfolder as its category.
 */
export function hakushiLoader({ base, pattern = '**/*.md', folderCategories = true }) {
	const loader = glob({ base, pattern });
	if (!folderCategories) return loader;
	return {
		...loader,
		load: (context) => {
			const baseDir = fileURLToPath(new URL(base, context.config.root));
			return loader.load({
				...context,
				parseData: (props) => {
					const category = props.data?.category == null && props.filePath ? folderCategory(baseDir, props.filePath) : undefined;
					return context.parseData(category ? { ...props, data: { ...props.data, category } } : props);
				},
			});
		},
	};
}

/** Top-level folder of `filePath` below `baseDir`, or undefined for files directly in it. */
function folderCategory(baseDir, filePath) {
	const parts = relative(baseDir, filePath).split(sep);
	return parts.length > 1 && parts[0] !== '..' ? parts[0] : undefined;
}

/**
 * Create the default content collections. Each collection loads from
 * `${base}/${id}` unless it sets its own `base` folder (and optionally a
 * `pattern`). `folderCategories` applies to every collection unless one sets
 * its own. Individual definitions can be replaced by spreading this result in
 * `src/content.config.ts`.
 */
export function createHakushiCollections({ base = './src/content', schema = hakushiSchema(), collections = DEFAULT_COLLECTIONS, folderCategories = true } = {}) {
	return Object.fromEntries(collections.map(({ id, base: folder, pattern, folderCategories: own }) => [
		id,
		defineCollection({
			loader: hakushiLoader({
				base: folder ?? `${base}/${id}`,
				...(pattern ? { pattern } : {}),
				folderCategories: own ?? folderCategories,
			}),
			schema,
		}),
	]));
}
