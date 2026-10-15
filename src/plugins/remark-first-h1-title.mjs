/**
 * remark-first-h1-title
 *
 * When an article has no usable frontmatter `title`, its first level-1
 * heading serves as the title (see `resolveEntryTitle` in
 * `src/lib/title.ts`, which extracts the same heading for listings). Since
 * the title is already shown in the article header, that heading is removed
 * from the rendered output - including the headings metadata that feeds the
 * table of contents. Articles with a frontmatter title are left untouched.
 *
 * Only top-level headings are considered, matching the plain-text extractor.
 *
 * @returns {import('unified').Plugin}
 */
export default function remarkFirstH1Title() {
	return (tree, file) => {
		const frontmatter = file?.data?.astro?.frontmatter;
		const title = frontmatter?.title;
		if (typeof title === 'string' && title.trim() !== '') return;

		const children = tree?.children;
		if (!Array.isArray(children)) return;
		const index = children.findIndex(
			(node) => node?.type === 'heading' && node.depth === 1 && headingText(node).trim() !== ''
		);
		if (index !== -1) children.splice(index, 1);
	};
}

/** Plain-text content of a heading node (text + inline code). */
function headingText(node) {
	let text = '';
	const collect = (current) => {
		if (!current) return;
		if (current.type === 'text' || current.type === 'inlineCode') {
			text += current.value ?? '';
		}
		for (const child of current.children ?? []) collect(child);
	};
	collect(node);
	return text;
}
