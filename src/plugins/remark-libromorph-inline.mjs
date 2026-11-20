import { visit } from 'unist-util-visit';

// LibroMorph's compact ruby and tate-chu-yoko notation. Work on text nodes so
// fenced/inline code, links, and existing Markdown markup keep their meaning.
const INLINE = /\{tcy:([^{}]+)\}|\{([^{}|]+)\|([^{}]+)\}|\[([^\]\n]+)\]\{(?:\.ruby\s+)?(?:ruby|rt)=["“]([^"”]+)["”]\}|\[([^\]\n]+)\]\{\.tcy\}|\[([^\]\n]+)\]\{\.dropcap\}/g;

function element(tagName, className, children) {
	return {
		type: 'libromorphInline',
		data: { hName: tagName, hProperties: className ? { className: [className] } : {}, hChildren: children },
	};
}

function ruby(base, annotation) {
	return element('ruby', '', [
		{ type: 'text', value: base },
		{ type: 'element', tagName: 'rp', properties: {}, children: [{ type: 'text', value: '(' }] },
		{ type: 'element', tagName: 'rt', properties: {}, children: [{ type: 'text', value: annotation }] },
		{ type: 'element', tagName: 'rp', properties: {}, children: [{ type: 'text', value: ')' }] },
	]);
}

export default function remarkLibromorphInline() {
	return (tree) => {
		visit(tree, 'text', (node, index, parent) => {
			if (!parent || typeof index !== 'number' || !node.value) return;
			const children = [];
			let last = 0;
			for (const match of node.value.matchAll(INLINE)) {
				if (match.index > last) children.push({ type: 'text', value: node.value.slice(last, match.index) });
				if (match[1] !== undefined) children.push(element('span', 'tcy', [{ type: 'text', value: match[1].trim() }]));
				else if (match[2] !== undefined) children.push(ruby(match[2], match[3]));
				else if (match[4] !== undefined) children.push(ruby(match[4], match[5]));
				else if (match[6] !== undefined) children.push(element('span', 'tcy', [{ type: 'text', value: match[6] }]));
				else children.push(element('span', 'dropcap', [{ type: 'text', value: match[7] }]));
				last = match.index + match[0].length;
			}
			if (!children.length) return;
			if (last < node.value.length) children.push({ type: 'text', value: node.value.slice(last) });
			parent.children.splice(index, 1, ...children);
			return [visit.SKIP, index + children.length];
		});
	};
}
