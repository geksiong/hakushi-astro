import { loadIcon } from './load-icon.mjs';
const copySvg = loadIcon('copy');
const checkSvg = loadIcon('check');
const codeSvg = loadIcon('code');
import {
	infoSvg,
	lightbulbSvg,
	triangleAlertSvg,
	shieldAlertSvg,
	circleAlertSvg,
	messageSquareQuoteSvg,
	circleCheckBigSvg,
	calloutIcon,
} from './callout-icons.mjs';

const COPY_ICON = copySvg
	.replace('width="24"', 'width="14"')
	.replace('height="24"', 'height="14"')
	.replace('<svg', '<svg class="icon-copy"');
const CHECK_ICON = checkSvg
	.replace('width="24"', 'width="14"')
	.replace('height="24"', 'height="14"')
	.replace('<svg', '<svg class="icon-check"');
const CODE_ICON = codeSvg
	.replace('width="24"', 'width="16"')
	.replace('height="24"', 'height="16"')
	.replace('<svg', '<svg class="code-header-icon"');

const CALLOUT_META = {
	note: { icon: infoSvg, defaultTitle: 'Note' },
	tip: { icon: lightbulbSvg, defaultTitle: 'Tip' },
	warning: { icon: triangleAlertSvg, defaultTitle: 'Warning' },
	danger: { icon: shieldAlertSvg, defaultTitle: 'Danger' },
	info: { icon: circleAlertSvg, defaultTitle: 'Info' },
	quote: { icon: messageSquareQuoteSvg, defaultTitle: 'Quote' },
	check: { icon: circleCheckBigSvg, defaultTitle: 'Checklist' },
	theorem: { icon: infoSvg, defaultTitle: 'Theorem' },
	definition: { icon: infoSvg, defaultTitle: 'Definition' },
	example: { icon: lightbulbSvg, defaultTitle: 'Example' },
	caution: { icon: triangleAlertSvg, defaultTitle: 'Caution' },
	tab: { icon: null, defaultTitle: null },
};

// The title is the rest of the marker line only. The body can share the
// marker's text node (":::tip\nPlain text\n:::"), so neither `\s*` (it would
// swallow the newline and take the body's first line as the title) nor a
// `$` anchor (it would need the marker to end the whole node) is safe here.
const OPEN_RE = /^:::[ \t]*(tab|note|tip|warning|danger|info|quote|check|theorem|definition|example|caution|quiz|vertical|horizontal)\b[ \t]*([^\n]*)(?:\n|$)/i;

/**
 * rehype-enhancer
 * Runs after shiki + mathjax. Two jobs:
 *  1. Rebuild the reference app's :::note / :::tip / :::tab containers from the
 *     rendered paragraphs (inner content is already fully rendered HTML).
 *  2. Wrap every regular code block in a GitHub-dark "CodeBlock" figure with a
 *     title/language header and a copy button (CodeBlock.tsx port).
 *
 * @returns {import('unified').Plugin}
 */
export default function rehypeEnhancer() {
	return (tree) => {
		buildContainers(tree);
		buildQuizzes(tree);
		wrapCodeBlocks(tree);
	};
}

/* ------------------------------------------------------------------ */
/* 1. Containers (:::note ... :::)                                     */
/* ------------------------------------------------------------------ */

function buildContainers(tree) {
	const stack = [tree];
	while (stack.length) {
		const parent = stack.pop();
		processParent(parent);

		if (!parent.children) continue;
		for (let i = parent.children.length - 1; i >= 0; i--) {
			const child = parent.children[i];
			if (
				child.type === 'element' &&
				child.children &&
				(child.tagName === 'blockquote' || child.tagName === 'li')
			) {
				stack.push(child);
			}
		}
	}
}

function processParent(parent) {
	if (!Array.isArray(parent.children)) return;

	let i = 0;
	while (i < parent.children.length) {
		const node = parent.children[i];

		if (node.type !== 'element' || node.tagName !== 'p') {
			i++;
			continue;
		}

		const marker = extractOpenMarker(node);
		if (!marker) {
			i++;
			continue;
		}

		i += collectContainer(parent, i, marker);
	}
}

/** If `p` opens a container, return {token, title}; the marker line is stripped. */
function extractOpenMarker(p) {
	const first = p.children?.[0];
	if (!first || first.type !== 'text') return null;
	const match = first.value.match(OPEN_RE);
	if (!match) return null;

	const token = match[1].toLowerCase();
	const customTitle = (match[2] || '').trim();

	let rest = first.value.slice(match[0].length);
	if (rest.startsWith('\r')) rest = rest.slice(1);
	if (rest.startsWith('\n')) rest = rest.slice(1);

	if (rest.trim()) {
		first.value = rest;
	} else {
		p.children.shift();
	}

	return { token, title: customTitle };
}

/**
 * Collect siblings after the open paragraph until a closing `:::` marker.
 * Returns how many children were consumed (the container replaces them all).
 */
function collectContainer(parent, openIdx, marker) {
	const meta = CALLOUT_META[marker.token] ?? { icon: null, defaultTitle: null };
	const isTab = marker.token === 'tab';
	const isQuiz = marker.token === 'quiz';
	const isWritingMode = marker.token === 'vertical' || marker.token === 'horizontal';
	const body = [];

	// The opener may still hold content after the marker line - keep it.
	const opener = parent.children[openIdx];
	if (opener.children && opener.children.length > 0) body.push(opener);

	// Case A: the container closes inside this same paragraph ("...content\n:::").
	const closedInline = stripTrailingClose(opener);

	let end = openIdx;
	if (!closedInline) {
		for (let j = openIdx + 1; j < parent.children.length; j++) {
			end = j;
			const sibling = parent.children[j];

			// Never look inside code/pre blocks for closers.
			if (sibling.type === 'element' && sibling.tagName === 'pre') {
				body.push(sibling);
				continue;
			}

			if (hasClosingMarker(sibling)) {
				const stripped = stripTrailingClose(sibling);
				if (stripped && hasContent(sibling)) body.push(sibling);
				break;
			}
			body.push(sibling);
		}
	}

	const titleText = marker.title || meta.defaultTitle;

	const titleChildren = [];
	if (meta.icon) titleChildren.push({ type: 'raw', value: calloutIcon(meta.icon) });
	if (titleText && !isTab) {
		titleChildren.push({
			type: 'element',
			tagName: 'span',
			properties: {},
			children: [{ type: 'text', value: titleText }],
		});
	} else if (titleText && isTab) {
		titleChildren.push({ type: 'text', value: titleText });
	}

	const children = [];
	if (titleChildren.length > 0) {
		children.push({
			type: 'element',
			tagName: isTab ? 'button' : 'div',
			properties: {
				className: [isTab ? 'tab-title' : 'callout-title'],
				...(isTab ? { type: 'button' } : {}),
			},
			children: titleChildren,
		});
	}
	for (const node of body) {
		if (!node.children || node.children.length > 0) children.push(node);
	}

	const container = {
		type: 'element',
		tagName: 'div',
		properties: {
			className: [isQuiz ? 'quiz-source' : isTab ? 'tab-group' : isWritingMode ? 'writing-mode-block' : 'callout', isWritingMode ? `writing-mode-${marker.token}` : isTab || isQuiz ? '' : `callout-${marker.token}`].filter(
				Boolean
			),
			...(isTab || isQuiz || isWritingMode ? {} : { 'data-callout': marker.token }),
			...(isQuiz ? { 'data-title': marker.title } : {}),
		},
		children: isQuiz || isWritingMode ? body : children,
	};

	parent.children.splice(openIdx, end - openIdx + 1, container);
	return 1; // continue scanning right after the container
}

/**
 * Find the last text node of an element, descending through inline/block
 * structure but never into code/pre (fences may legitimately contain ":::").
 */
function findLastText(node) {
	const kids = node.children ?? [];
	for (let k = kids.length - 1; k >= 0; k--) {
		const child = kids[k];
		if (!child) continue;
		if (child.type === 'text') {
			// remark-rehype sprinkles whitespace-only "\n" nodes between blocks;
			// skip them so we descend into the real last element.
			if (child.value.trim() === '') continue;
			return child;
		}
		if (child.type === 'element') {
			if (child.tagName === 'code' || child.tagName === 'pre') continue;
			const found = findLastText(child);
			if (found) return found;
		}
	}
	return null;
}

/** True when the node's last line is exactly ":::" (a closing fence). */
function hasClosingMarker(node) {
	if (!node || node.type !== 'element') return false;
	if (node.tagName === 'pre' || node.tagName === 'code') return false;
	const last = findLastText(node);
	if (!last) return false;

	const idx = last.value.lastIndexOf(':::');
	if (idx === -1) return false;
	// Must start its own line and have nothing but whitespace after it.
	const lineStart = last.value.lastIndexOf('\n', idx) + 1;
	if (last.value.slice(lineStart, idx).trim() !== '') return false;
	if (last.value.slice(idx + 3).trim() !== '') return false;
	return true;
}

/**
 * Remove the trailing ":::" line from the node's deepest-last text.
 * Returns true when a closing marker was found & removed.
 */
function stripTrailingClose(node) {
	if (!node || !hasClosingMarker(node)) return false;
	const last = findLastText(node);
	const idx = last.value.lastIndexOf(':::');
	let value = last.value.slice(0, idx);

	// Drop trailing whitespace-only remnants left behind by the fence.
	value = value.replace(/\n[ \t]*$/, '');

	last.value = value;

	// Prune now-empty containers up from the text (best effort, one level).
	if (!value.trim()) {
		pruneEmptyTail(node);
	}
	return true;
}

function hasContent(node) {
	return findLastText(node)?.value?.trim() !== '' || (node.children?.length ?? 0) > 0;
}

/** Remove empty trailing children of `node` recursively (bottom-up). */
function pruneEmptyTail(node) {
	if (!node.children?.length) return;
	const last = node.children[node.children.length - 1];
	if (!last) return;
	if (last.type === 'text') {
		if (!last.value.trim()) node.children.pop();
	} else if (last.type === 'element') {
		pruneEmptyTail(last);
		if ((last.children?.length ?? 0) === 0) node.children.pop();
	}
}

/* ------------------------------------------------------------------ */
/* LibroMorph knowledge checks                                         */
/* ------------------------------------------------------------------ */

function quizElement(tagName, className, children = [], properties = {}) {
	return { type: 'element', tagName, properties: { ...(className ? { className: [className] } : {}), ...properties }, children };
}

function quizText(value) {
	return { type: 'text', value };
}

function checkedOption(li) {
	const content = li.children?.find((child) => child.type === 'element' && child.tagName === 'p') ?? li;
	const children = [...(content.children ?? [])];
	const checkbox = children.findIndex((child) => child.type === 'element' && child.tagName === 'input' && child.properties?.type === 'checkbox');
	if (checkbox >= 0) {
		const correct = Boolean(children[checkbox].properties?.checked);
		children.splice(checkbox, 1);
		if (children[0]?.type === 'text') children[0].value = children[0].value.replace(/^\s+/, '');
		return { correct, children };
	}
	const first = children.find((child) => child.type === 'text' && child.value.trim());
	const match = first?.value.match(/^\s*\[([ xX])\]\s*/);
	if (!match) return null;
	first.value = first.value.slice(match[0].length);
	return { correct: match[1].toLowerCase() === 'x', children };
}

function buildQuizzes(tree) {
	let count = 0;
	const walk = (parent) => {
		if (!parent.children) return;
		for (let i = 0; i < parent.children.length; i++) {
			const node = parent.children[i];
			if (node.type !== 'element') continue;
			if ((node.properties?.className ?? []).includes('quiz-source')) {
				const quiz = makeQuiz(node, ++count);
				if (quiz) parent.children[i] = quiz;
			} else walk(node);
		}
	};
	walk(tree);
}

function makeQuiz(source, number) {
	const blocks = source.children.filter((node) => node.type === 'element');
	const listIndex = blocks.findIndex((node) => node.tagName === 'ul');
	if (listIndex < 0) return null;
	const options = blocks[listIndex].children
		.filter((node) => node.type === 'element' && node.tagName === 'li')
		.map(checkedOption);
	// Leave malformed quiz markup visible as authored instead of presenting a
	// question with an answer that cannot be graded.
	if (options.length < 2 || options.some((option) => !option) || options.filter((option) => option.correct).length !== 1) return null;
	const questionId = `hakushi-quiz-question-${number}`;
	const optionNodes = options.map((option, index) => quizElement('button', 'quiz-option', [
		quizElement('span', 'quiz-option-letter', [quizText(String.fromCharCode(65 + index))], { ariaHidden: 'true' }),
		quizElement('span', 'quiz-option-content', option.children),
	], { type: 'button', 'data-correct': option.correct ? 'true' : 'false' }));
	const answer = options.find((option) => option.correct);
	return quizElement('section', 'quiz-card', [
		quizElement('div', 'quiz-heading', [quizText(source.properties['data-title'] || `Knowledge Check ${number}`)]),
		quizElement('div', 'quiz-question', blocks.slice(0, listIndex), { id: questionId }),
		quizElement('div', 'quiz-options', optionNodes, { role: 'group', ariaLabelledBy: questionId }),
		quizElement('p', 'quiz-feedback', [], { role: 'status', ariaLive: 'polite', hidden: true }),
		quizElement('button', 'quiz-retry', [quizText('Try again')], { type: 'button', hidden: true }),
		quizElement('details', 'quiz-answer', [
			quizElement('summary', '', [quizText('Reveal answer and explanation')]),
			quizElement('div', 'quiz-answer-body', [
				quizElement('p', '', [quizText('Correct answer: '), ...answer.children]),
				...blocks.slice(listIndex + 1),
			]),
		]),
	]);
}

/* ------------------------------------------------------------------ */
/* 2. Code block figures                                               */
/* ------------------------------------------------------------------ */

function wrapCodeBlocks(tree) {
	const stack = [tree];
	while (stack.length) {
		const node = stack.pop();
		if (!node.children) continue;
		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			if (child.type === 'element' && child.tagName === 'pre') {
				node.children[i] = wrapPre(child);
				continue;
			}
			stack.push(child);
		}
	}
}

function wrapPre(pre) {
	const titleAttr = pre.properties?.['data-title'] ?? pre.properties?.dataTitle;
	const title = typeof titleAttr === 'string' ? titleAttr : '';
	delete pre.properties.dataTitle;

	const code = pre.children?.find((c) => c.tagName === 'code');
	const classes = code?.properties?.className ?? [];
	const langClass = Array.isArray(classes)
		? classes.find((c) => String(c).startsWith('language-'))
		: undefined;
	const lang = langClass ? String(langClass).slice('language-'.length).toLowerCase() : '';

	// Neutralise shiki chrome; the figure provides it instead.
	pre.properties.style = `${pre.properties.style ?? ''};background:transparent;padding:1rem;margin:0;`.trim();

	return {
		type: 'element',
		tagName: 'figure',
		properties: { className: ['code-block'] },
		children: [
			{
				type: 'element',
				tagName: 'figcaption',
				properties: { className: ['code-header'] },
				children: [
					{
						type: 'element',
						tagName: 'span',
						properties: { className: ['code-header-left'] },
						children: [
							{ type: 'raw', value: CODE_ICON },
							{
								type: 'element',
								tagName: 'span',
								properties: { className: ['code-title'] },
								children: [{ type: 'text', value: title || (lang ? lang.toUpperCase() : 'CODE') }],
							},
						],
					},
					{
						type: 'element',
						tagName: 'button',
						properties: {
							className: ['code-copy-btn'],
							type: 'button',
							title: 'Copy code',
						},
						children: [
							{ type: 'raw', value: COPY_ICON },
							{ type: 'raw', value: CHECK_ICON },
							{
								type: 'element',
								tagName: 'span',
								properties: {},
								children: [{ type: 'text', value: 'Copy' }],
							},
						],
					},
				],
			},
			pre,
		],
	};
}
