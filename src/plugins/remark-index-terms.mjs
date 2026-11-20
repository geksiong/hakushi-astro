import { visit } from 'unist-util-visit';
import { INDEX_RE, indexMarker, indexAnchor } from '../lib/term-index.mjs';

export default function remarkIndexTerms() {
	return (tree) => {
		const counts = new Map();
		visit(tree, 'text', (node, index, parent) => {
			if (!parent || typeof index !== 'number') return;
			const children = [];
			let last = 0;
			for (const match of node.value.matchAll(INDEX_RE)) {
				const marker = indexMarker(match);
				if (!marker) continue;
				if (match.index > last) children.push({ type: 'text', value: node.value.slice(last, match.index) });
				children.push({
					type: 'indexTerm',
					data: {
						hName: 'span',
						hProperties: { id: indexAnchor(marker.term, counts), className: [marker.visible ? 'index-term' : 'index-anchor'], dataEntry: marker.term },
						hChildren: marker.visible ? [{ type: 'text', value: marker.label }] : [],
					},
				});
				last = match.index + match[0].length;
			}
			if (!children.length) return;
			if (last < node.value.length) children.push({ type: 'text', value: node.value.slice(last) });
			parent.children.splice(index, 1, ...children);
			return [visit.SKIP, index + children.length];
		});
	};
}
