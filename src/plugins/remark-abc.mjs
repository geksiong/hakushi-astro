import { loadIcon } from './load-icon.mjs';
const musicSvg = loadIcon('music-2');

const MUSIC_ICON = musicSvg
	.replace('width="24"', 'width="16"')
	.replace('height="24"', 'height="16"')
	.replace('<svg', '<svg class="abc-header-icon"');

/**
 * remark-abc
 * Runs before shiki, so ```abc and ```abc2svg fences never become code blocks.
 * Converts them into static figure markup with the ABC source embedded in a
 * data attribute, hydrated client-side by the matching renderer:
 * - ```abc     → `data-abc`, src/scripts/abc.ts (abcjs, with playback)
 * - ```abc2svg → `data-abc2svg`, src/scripts/abc2svg.ts (abc2svg, which also
 *   handles abc2svg-only directives such as %%jianpu)
 *
 * @returns {import('unified').Plugin}
 */
export default function remarkAbc() {
	return (tree) => {
		const visit = (node) => {
			if (!node.children) return;
			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				const lang = child.type === 'code' ? (child.lang ?? '').toLowerCase() : '';
				if (lang === 'abc' || lang === 'abc2svg') {
					node.children[i] = buildAbcFigure(child.value, lang);
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

function buildAbcFigure(rawSource, renderer) {
	const source = rawSource.trim();
	const title = extractTitle(source);
	const isAbc2svg = renderer === 'abc2svg';

	return {
		type: 'abcBlock',
		data: {
			hName: 'figure',
			hProperties: { className: isAbc2svg ? ['abc-block', 'abc2svg-block'] : ['abc-block'] },
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
									children: [{ type: 'text', value: isAbc2svg ? 'abc2svg' : 'ABC' }],
								}
							: { type: 'text', value: '' },
					],
				},
				{
					type: 'element',
					tagName: 'div',
					properties: {
						className: isAbc2svg ? ['abc-body', 'abc2svg-body'] : ['abc-body'],
						...(isAbc2svg ? { dataAbc2svg: source } : { dataAbc: source }),
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
