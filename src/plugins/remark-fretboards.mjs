import { visit } from 'unist-util-visit';

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);

export default function remarkFretboards() {
	return (tree) => {
		visit(tree, 'code', (node, index, parent) => {
			const kind = node.lang?.toLowerCase();
			if (!['fretboard', 'fretdrom'].includes(kind) || !parent || typeof index !== 'number') return;
			let title = kind === 'fretboard' ? 'Fretboard diagram' : 'Fretdrom diagram';
			let error = '';
			if (kind === 'fretboard') {
				try {
					const spec = JSON.parse(node.value);
					if (!spec || Array.isArray(spec) || typeof spec !== 'object' || (!spec.scale && !Array.isArray(spec.dots))) throw new Error('Provide a JSON object with scale or dots.');
					if (typeof spec.title === 'string') title = spec.title;
				} catch (cause) { error = cause.message; }
			}
			const markup = error
				? `<figure class="fret-diagram fret-error"><figcaption>Could not draw fretboard: ${esc(error)}</figcaption><pre><code>${esc(node.value)}</code></pre></figure>`
				: `<figure class="fret-diagram" data-fret-kind="${kind}" data-fret-source="${esc(node.value)}"><figcaption>${esc(title)}</figcaption><div class="fret-render" role="img" aria-label="${esc(title)}"></div><noscript>Enable JavaScript to view this diagram.</noscript></figure>`;
			parent.children[index] = { type: 'html', value: markup };
		});
	};
}
