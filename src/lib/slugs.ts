/**
 * URL-safe slug shared by the graph builder, /tags & /categories pages,
 * and collection browser so taxonomy URLs always match generated static routes.
 */
export function taxonomySlug(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^\p{L}\p{N}-]+/gu, '')
		.replace(/-{2,}/g, '-')
		.replace(/^-+|-+$/g, '');
}
