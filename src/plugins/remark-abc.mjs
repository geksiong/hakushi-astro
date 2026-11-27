import { loadIcon } from './load-icon.mjs';
import { parseFenceAttributes } from './fence-attributes.mjs';
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
 * LibroMorph's attribute form works too: ```{#my-id .abc} sets the figure id,
 * and ```{.abc .listen} makes a listening item, which keeps its title and
 * player but hides the notation (for ear tests whose score gives the answer away).
 *
 * `swing` (a percentage: 66 is 2:1, 50 or less is straight) swings offbeat
 * eighths in playback; a score overrides it with `%%MIDI swing N`.
 *
 * @param {{ swing?: number }} [options]
 * @returns {import('unified').Plugin}
 */
export default function remarkAbc({ swing = 0 } = {}) {
	return (tree, file) => {
		const where = file?.path ? ` in ${file.path}` : '';
		const visit = (node) => {
			if (!node.children) return;
			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				const fence = child.type === 'code' ? abcFence(child) : null;
				if (fence) {
					if (fence.listen && fence.renderer === 'abc2svg') {
						console.warn(`[hakushi] .listen needs playback, which only \`\`\`abc scores have; showing the abc2svg score${where}`);
					}
					node.children[i] = buildAbcFigure(child.value, fence, swing);
					continue;
				}
				visit(child);
			}
		};
		visit(tree);
	};
}

/** The renderer, id and listening flag of an ABC fence, or null for any other code block. */
function abcFence(node) {
	const lang = (node.lang ?? '').toLowerCase();
	if (lang === 'abc' || lang === 'abc2svg') {
		const { classes, id } = parseFenceAttributes('', node.meta);
		return { renderer: lang, id, listen: lang === 'abc' && classes.includes('listen') };
	}
	if (!lang.startsWith('{')) return null;
	const { classes, id } = parseFenceAttributes(node.lang, node.meta);
	const names = classes.map((name) => name.toLowerCase());
	const renderer = names.includes('abc2svg') ? 'abc2svg' : names.includes('abc') ? 'abc' : null;
	if (!renderer) return null;
	return { renderer, id, listen: names.includes('listen') };
}

/** Swing percentage for a score: its own `%%MIDI swing N`, else the site default. */
function swingFor(source, fallback) {
	const own = source.match(/^%%MIDI\s+swing\s+(\d+)/m);
	const value = own ? Number(own[1]) : Number(fallback) || 0;
	return value > 50 ? Math.round(value) : 0;
}

/** Extract the T: (title) field from an ABC source string, if present. */
function extractTitle(raw) {
	const match = raw.match(/^\s*T:\s*(.+)$/m);
	return match ? match[1].trim() : '';
}

function buildAbcFigure(rawSource, { renderer, id, listen }, defaultSwing) {
	const source = rawSource.trim();
	const title = extractTitle(source);
	const isAbc2svg = renderer === 'abc2svg';
	const isListen = listen && !isAbc2svg;
	const swing = isAbc2svg ? 0 : swingFor(source, defaultSwing);
	const figureClasses = ['abc-block'];
	if (isAbc2svg) figureClasses.push('abc2svg-block');
	if (isListen) figureClasses.push('abc-listen');

	const body = {
		type: 'element',
		tagName: 'div',
		properties: {
			className: isAbc2svg ? ['abc-body', 'abc2svg-body'] : ['abc-body'],
			...(isAbc2svg ? { dataAbc2svg: source } : { dataAbc: source }),
			...(swing ? { dataSwing: String(swing) } : {}),
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
	};

	return {
		type: 'abcBlock',
		data: {
			hName: 'figure',
			hProperties: { className: figureClasses, ...(id ? { id } : {}) },
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
							children: [{ type: 'text', value: title || (isListen ? 'Listening item' : 'Untitled Melody') }],
						},
						source
							? {
									type: 'element',
									tagName: 'span',
									properties: { className: ['abc-header-type'] },
									children: [{ type: 'text', value: isAbc2svg ? 'abc2svg' : isListen ? 'Listen' : 'ABC' }],
								}
							: { type: 'text', value: '' },
					],
				},
				isListen ? listenWrapper(body) : body,
			],
		},
	};
}

/**
 * A listening item's notation is still engraved (the player needs abcjs' tune
 * object) but kept off screen. abcjs writes inline layout styles onto the
 * element it renders into, so the hiding is done by a wrapper it never touches.
 */
function listenWrapper(body) {
	return {
		type: 'element',
		tagName: 'div',
		properties: { className: ['abc-listen-notation'], ariaHidden: 'true' },
		children: [body],
	};
}
