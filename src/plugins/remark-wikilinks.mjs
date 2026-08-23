import { visit } from 'unist-util-visit';

/**
 * remark-wikilinks
 * Converts Obsidian-style wiki links `[[slug|Label]]` / `[[slug]]` into regular
 * internal links. Targets are site-root-relative slugs (e.g. `guides/getting-started`).
 *
 * @returns {import('unified').Plugin}
 */
export default function remarkWikilinks() {
	return (tree) => {
		visit(tree, 'text', (node, index, parent) => {
			const WIKILINK = /\[\[([^\]|\n]+)(?:\|([^\]\n]*))?\]\]/g;
			const value = node.value;
			if (!parent || typeof value !== 'string' || !WIKILINK.test(value)) return;

			WIKILINK.lastIndex = 0;
			const children = [];
			let last = 0;
			let match;

			while ((match = WIKILINK.exec(value)) !== null) {
				if (match.index > last) {
					children.push({ type: 'text', value: value.slice(last, match.index) });
				}

				const [, rawTarget, rawLabel] = match;
				const target = rawTarget.trim().replace(/^\/+/, '').replace(/#.*$/, '');
				const label =
					(rawLabel && rawLabel.trim()) ||
					target.split('/').pop()?.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
					target;

				children.push({
					type: 'link',
					url: `/${target}`,
					title: null,
					data: { hName: 'a', hProperties: { className: ['wikilink'] } },
					children: [{ type: 'text', value: label }],
				});

				last = match.index + match[0].length;
			}

			if (last < value.length) {
				children.push({ type: 'text', value: value.slice(last) });
			}

			parent.children.splice(index, 1, ...children);
			return [visit.SKIP, index + children.length];
		});
	};
}
