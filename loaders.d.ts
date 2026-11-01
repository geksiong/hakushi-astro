export function hakushiSchema(options?: { extend?: Record<string, unknown> }): any;
export function hakushiLoader(options: {
	base: string | URL;
	pattern?: string | string[];
	/** Use a note's top-level subfolder name as its category when frontmatter has none. Defaults to `true`. */
	folderCategories?: boolean;
}): unknown;
export interface HakushiCollectionSource {
	id: string;
	/** Content folder for this collection, relative to the project root. Defaults to `${base}/${id}`. */
	base?: string | URL;
	/** Glob pattern(s) matched inside the folder. Defaults to `'**\/*.md'`. */
	pattern?: string | string[];
	/** Overrides the top-level `folderCategories` for this collection. */
	folderCategories?: boolean;
}
export function createHakushiCollections(options?: {
	/** Parent folder of collections without their own `base`. Defaults to `'./src/content'`. */
	base?: string;
	schema?: unknown;
	collections?: HakushiCollectionSource[];
	/**
	 * Use each note's top-level subfolder name (relative to its collection's folder)
	 * as its category when frontmatter sets none. Defaults to `true`.
	 */
	folderCategories?: boolean;
}): Record<string, unknown>;
