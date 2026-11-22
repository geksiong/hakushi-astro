import { visit } from 'unist-util-visit';
import { slug as githubSlug } from 'github-slugger';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const MD_LINK = /^([^?#]+\.md)(#.*)?$/i;

/** Frontmatter `slug:` of a Markdown file, which Astro uses as the entry id. */
function frontmatterSlug(path) {
	try {
		const frontmatter = readFileSync(path, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
		const slug = frontmatter?.[1].match(/^slug:\s*["']?([^"'\n]+?)["']?\s*$/m);
		return slug ? slug[1] : null;
	} catch {
		return null;
	}
}

/** Entry id as Astro's glob loader makes it: slugged path segments, without `/index`. */
function entryId(dir, path) {
	return frontmatterSlug(path) ?? relative(dir, path).replace(/\.md$/i, '').split(sep).map((segment) => githubSlug(segment)).join('/').replace(/\/index$/, '');
}

/**
 * remark-md-links
 * Rewrites links to other Markdown files (`[see](../guides/setup.md#install)`)
 * into the article's site URL (`/docs/guides/setup#install`), resolving the
 * target relative to the linking file, so notes written for a file browser or
 * another Markdown tool keep working links on the site. Links into a folder
 * that is not a collection are left as written, with a build warning.
 *
 * @param {{ collections?: { id: string, dir: string }[] }} options
 *   `dir` is the collection's absolute content folder.
 */
export default function remarkMdLinks({ collections = [] } = {}) {
	// Longest folder first, so a collection nested inside another wins.
	const dirs = [...collections].sort((a, b) => b.dir.length - a.dir.length);
	const collectionFor = (path) => dirs.find(({ dir }) => {
		const rel = relative(dir, path);
		return rel && !rel.startsWith('..') && !isAbsolute(rel);
	});

	return (tree, file) => {
		if (!file?.path) return;
		const from = dirname(file.path);
		visit(tree, (node) => node.type === 'link' || node.type === 'definition', (node) => {
			const url = node.url ?? '';
			if (SCHEME.test(url) || url.startsWith('/') || url.startsWith('#')) return;
			const match = url.match(MD_LINK);
			if (!match) return;
			let target;
			try {
				target = resolve(from, decodeURI(match[1]));
			} catch {
				return;
			}
			const collection = collectionFor(target);
			if (!collection) {
				console.warn(`[hakushi] link to ${url} in ${file.path} is outside every collection; left as written`);
				return;
			}
			if (!existsSync(target)) console.warn(`[hakushi] link to missing file ${url} in ${file.path}`);
			const id = entryId(collection.dir, target);
			node.url = `/${collection.id}${id ? `/${id}` : ''}${match[2] ?? ''}`;
		});
	};
}
