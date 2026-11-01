import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { basename, relative, sep } from 'node:path';
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
 * Create a glob loader for one Hakushi Markdown collection. Frontmatter always
 * wins; otherwise:
 * - unless `folderCategories` is false, a note in a subfolder of `base` gets
 *   the name of its top-level subfolder as its `category`;
 * - with `filenameDates`, a note whose filename starts with a date
 *   (`2026-09-01-title.md`, `2026_09_01`, `2026.09.01` or `20260901`) gets it as its `date`.
 */
export function hakushiLoader({ base, pattern = '**/*.md', folderCategories = true, filenameDates = false }) {
	const loader = glob({ base, pattern });
	if (!folderCategories && !filenameDates) return loader;
	return {
		...loader,
		load: (context) => {
			const baseDir = fileURLToPath(new URL(base, context.config.root));
			return loader.load({
				...context,
				parseData: (props) => {
					const data = { ...props.data };
					if (props.filePath) {
						if (folderCategories && data.category == null) data.category = folderCategory(baseDir, props.filePath);
						if (filenameDates && data.date == null) data.date = filenameDate(props.filePath);
					}
					for (const key of ['category', 'date']) if (data[key] === undefined) delete data[key];
					return context.parseData({ ...props, data });
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
 * ISO date (`YYYY-MM-DD`) at the start of a filename, or undefined. Accepts
 * `-`, `_` or `.` separators or none, and rejects impossible dates (2026-02-30).
 */
function filenameDate(filePath) {
	const match = basename(filePath).match(/^(\d{4})([-_.]?)(\d{2})\2(\d{2})(?!\d)/);
	if (!match) return undefined;
	const [, year, , month, day] = match;
	const iso = `${year}-${month}-${day}`;
	const parsed = new Date(`${iso}T00:00:00Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(iso) ? iso : undefined;
}

/**
 * Create the default content collections. Each collection loads from
 * `${base}/${id}` unless it sets its own `base` folder (and optionally a
 * `pattern`). `folderCategories` applies to every collection unless one sets
 * its own. Collections with `type: 'dated'` take missing dates from their
 * filenames unless they set `filenameDates: false`. Individual definitions
 * can be replaced by spreading this result in `src/content.config.ts`.
 */
export function createHakushiCollections({ base = './src/content', schema = hakushiSchema(), collections = DEFAULT_COLLECTIONS, folderCategories = true } = {}) {
	return Object.fromEntries(collections.map(({ id, type, base: folder, pattern, folderCategories: own, filenameDates }) => [
		id,
		defineCollection({
			loader: hakushiLoader({
				base: folder ?? `${base}/${id}`,
				...(pattern ? { pattern } : {}),
				folderCategories: own ?? folderCategories,
				filenameDates: filenameDates ?? type === 'dated',
			}),
			schema,
		}),
	]));
}
