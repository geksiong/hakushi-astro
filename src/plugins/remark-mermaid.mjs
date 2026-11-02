import { visit } from 'unist-util-visit';

function escapeHtml(value) {
	return value.replace(/[&<>"']/g, (character) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
	})[character]);
}

/** Convert Mermaid code fences to `<pre class="mermaid">` elements, rendered client-side by src/scripts/mermaid.ts. */
export default function remarkMermaid() {
	return (tree) => {
		visit(tree, 'code', (node, index, parent) => {
			if (node.lang !== 'mermaid' || !parent || typeof index !== 'number') return;
			parent.children[index] = { type: 'html', value: `<pre class="mermaid">${escapeHtml(node.value)}</pre>` };
		});
	};
}
