import { loadIcon } from './load-icon.mjs';
const musicSvg = loadIcon('music-2');

const MUSIC_ICON = musicSvg
	.replace('width="24"', 'width="16"')
	.replace('height="24"', 'height="16"')
	.replace('<svg', '<svg class="abc-header-icon"');

/**
 * remark-abc
 * Runs before shiki, so ```abc fences never become code blocks.
 * Converts them into static figure markup with the ABC source embedded in
 * `data-abc`; hydrated client-side by src/scripts/abc.ts (abcjs).
 *
 * @returns {import('unified').Plugin}
 */
export default function remarkAbc() {
	return (tree) => {
		const visit = (node) => {
			if (!node.children) return;
			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				if (child.type === 'code' && (child.lang ?? '').toLowerCase() === 'abc') {
					node.children[i] = buildAbcFigure(child.value);
					continue;
				}
				visit(child);
			}
		};
		visit(tree);
	};
}

/** Extract the T: (title) field from an ABC source string, if present. */
function extractTitle(raw) {
	const match = raw.match(/^\s*T:\s*(.+)$/m);
	return match ? match[1].trim() : '';
}

function buildAbcFigure(rawSource) {
	const source = rawSource.trim();
	const title = extractTitle(source);

	return {
		type: 'abcBlock',
		data: {
			hName: 'figure',
			hProperties: { className: ['abc-block'] },
			hChildren: [
				{
					type: 'element',
					tagName: 'figcaption',
					properties: { className: ['abc-header'] },
					children: [
						{ type: 'raw', value: MUSIC_ICON },
						{
							type: 'element',
							tagName: 'span',
							properties: { className: ['abc-header-title'] },
							children: [{ type: 'text', value: title || 'Untitled Melody' }],
						},
						source
							? {
									type: 'element',
									tagName: 'span',
									properties: { className: ['abc-header-type'] },
									children: [{ type: 'text', value: 'ABC' }],
								}
							: { type: 'text', value: '' },
					],
				},
				{
					type: 'element',
					tagName: 'div',
					properties: {
						className: ['abc-body'],
						dataAbc: source,
					},
					children:
						source === ''
							? [
									{
										type: 'element',
										tagName: 'p',
										properties: { className: ['abc-invalid'] },
										children: [{ type: 'text', value: 'Empty ABC notation block.' }],
									},
								]
							: [],
				},
			],
		},
	};
}
