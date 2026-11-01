export function hakushiSchema(options?: { extend?: Record<string, unknown> }): any;
export function hakushiLoader(options: { base: string | URL; pattern?: string | string[] }): unknown;
export interface HakushiCollectionSource {
	id: string;
	/** Content folder for this collection, relative to the project root. Defaults to `${base}/${id}`. */
	base?: string | URL;
	/** Glob pattern(s) matched inside the folder. Defaults to `'**\/*.md'`. */
	pattern?: string | string[];
}
export function createHakushiCollections(options?: {
	/** Parent folder of collections without their own `base`. Defaults to `'./src/content'`. */
	base?: string;
	schema?: unknown;
	collections?: HakushiCollectionSource[];
}): Record<string, unknown>;
