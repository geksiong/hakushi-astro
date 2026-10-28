/**
 * Read the article aloud with the browser's Web Speech API. The control in
 * the article header stays hidden unless speech synthesis is available.
 *
 * Text comes from the elements marked `data-read-aloud` (title, summary and
 * body). The body is read block by block - headings, paragraphs, list items,
 * quotes - skipping code blocks, diagrams, charts, music, math (MathJax keeps
 * no readable source) and tables. Inline code is read as text and inline
 * math as "formula". Each
 * block is queued as its own utterance (long ones split by sentence), which
 * keeps Chrome from cutting off long utterances and lets the block being
 * spoken be highlighted.
 *
 * Other controls (the floating cluster) stay in sync through two document
 * events: `hakushi:read-aloud-state` ({ state }) is dispatched on every state
 * change, and `hakushi:read-aloud-command` ({ action: 'toggle' | 'stop' })
 * drives playback.
 */

export type ReadAloudState = 'idle' | 'playing' | 'paused';
export type ReadAloudCommand = 'toggle' | 'stop';

const BLOCKS = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd, figcaption, .callout-title';
const SKIP = 'pre, .code-block, .chart-block, .abc-block, .mermaid, mjx-container, svg, table, button, script, style, [aria-hidden="true"]';
// MathJax keeps no readable source, so inline math is spoken as a placeholder
// to keep the sentence intact; display math is skipped like other figures.
const INLINE_MATH = 'mjx-container:not([display="true"])';
const MAX_CHUNK = 220;

interface Chunk {
	text: string;
	el: HTMLElement;
}

/** Text of `el` excluding skipped subtrees and nested blocks (read separately). */
function ownText(el: Element): string {
	let text = '';
	for (const node of el.childNodes) {
		if (node.nodeType === Node.TEXT_NODE) {
			text += node.textContent ?? '';
		} else if (node instanceof Element && node.matches(INLINE_MATH)) {
			text += ' formula ';
		} else if (node instanceof Element && !node.matches(SKIP) && !node.matches(BLOCKS)) {
			text += ownText(node);
		}
	}
	return text.replace(/\s+/g, ' ').trim();
}

/** Split long text at sentence boundaries into pieces of at most ~MAX_CHUNK characters. */
function splitText(text: string, lang: string): string[] {
	if (text.length <= MAX_CHUNK) return [text];
	const sentences =
		typeof Intl !== 'undefined' && 'Segmenter' in Intl
			? Array.from(new Intl.Segmenter(lang || undefined, { granularity: 'sentence' }).segment(text), (s) => s.segment)
			: text.split(/(?<=[.!?])\s+/);
	const pieces: string[] = [];
	let current = '';
	for (const sentence of sentences) {
		if (current && current.length + sentence.length > MAX_CHUNK) {
			pieces.push(current.trim());
			current = '';
		}
		current += sentence;
	}
	if (current.trim()) pieces.push(current.trim());
	return pieces;
}

function collectChunks(lang: string): Chunk[] {
	const chunks: Chunk[] = [];
	for (const source of document.querySelectorAll<HTMLElement>('[data-read-aloud]')) {
		const blocks = source.matches(BLOCKS) ? [source] : Array.from(source.querySelectorAll<HTMLElement>(BLOCKS));
		for (const el of blocks) {
			if (el.closest(SKIP)) continue;
			const text = ownText(el);
			if (!text) continue;
			for (const piece of splitText(text, lang)) chunks.push({ text: piece, el });
		}
	}
	return chunks;
}

export function setupReadAloud() {
	const root = document.getElementById('read-aloud');
	const toggle = root?.querySelector<HTMLButtonElement>('[data-read-aloud-toggle]');
	const label = toggle?.querySelector<HTMLElement>('[data-read-aloud-label]');
	const pauseIcon = toggle?.querySelector<SVGElement>('[data-read-aloud-icon="pause"]');
	const playIcon = toggle?.querySelector<SVGElement>('[data-read-aloud-icon="play"]');
	const stopButton = root?.querySelector<HTMLButtonElement>('[data-read-aloud-stop]');
	if (!root || !toggle || !label || !pauseIcon || !playIcon || !stopButton) return;
	if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;

	const synth = window.speechSynthesis;
	const lang = document.documentElement.lang;
	type State = ReadAloudState;
	let state: State = 'idle';
	let current: HTMLElement | null = null;
	// Follow the spoken block by scrolling, until the reader scrolls on their
	// own; following resumes once the spoken block is back on screen.
	let follow = true;
	// Bumped on every stop so callbacks from cancelled utterances are ignored.
	let session = 0;

	// Speech from a previous page can outlive navigation in some browsers.
	synth.cancel();
	root.hidden = false;

	const highlight = (el: HTMLElement | null) => {
		if (el === current) return;
		current?.classList.remove('read-aloud-current');
		current = el;
		if (!el) return;
		el.classList.add('read-aloud-current');
		const rect = el.getBoundingClientRect();
		const onScreen = rect.top >= 80 && rect.bottom <= window.innerHeight;
		if (onScreen) {
			follow = true;
		} else if (follow) {
			el.scrollIntoView({ block: 'center', behavior: 'smooth' });
		}
	};

	const render = (next: State) => {
		state = next;
		// Idle shows the "Listen" label; while reading, pause/resume and stop icons.
		const name = state === 'playing' ? 'Pause reading' : state === 'paused' ? 'Resume reading' : 'Read article aloud';
		toggle.setAttribute('aria-label', name);
		toggle.title = name;
		label.hidden = state !== 'idle';
		pauseIcon.toggleAttribute('hidden', state !== 'playing');
		playIcon.toggleAttribute('hidden', state !== 'paused');
		stopButton.hidden = state === 'idle';
		if (state === 'idle') highlight(null);
		document.dispatchEvent(new CustomEvent('hakushi:read-aloud-state', { detail: { state } }));
	};

	const stop = () => {
		session++;
		synth.cancel();
		render('idle');
	};

	const play = () => {
		const chunks = collectChunks(lang);
		if (chunks.length === 0) return;
		const id = ++session;
		follow = true;
		synth.cancel();
		chunks.forEach((chunk, i) => {
			const utterance = new SpeechSynthesisUtterance(chunk.text);
			if (lang) utterance.lang = lang;
			utterance.onstart = () => {
				if (id === session) highlight(chunk.el);
			};
			if (i === chunks.length - 1) {
				utterance.onend = () => {
					if (id === session) render('idle');
				};
			}
			utterance.onerror = (e) => {
				// "interrupted"/"canceled" come from our own stop; anything else ends playback.
				if (id === session && e.error !== 'interrupted' && e.error !== 'canceled') stop();
			};
			synth.speak(utterance);
		});
		render('playing');
	};

	const togglePlayback = () => {
		if (state === 'idle') {
			play();
		} else if (state === 'playing') {
			synth.pause();
			render('paused');
		} else {
			synth.resume();
			render('playing');
		}
	};

	toggle.addEventListener('click', togglePlayback);
	stopButton.addEventListener('click', stop);
	document.addEventListener('hakushi:read-aloud-command', (e) => {
		const action = (e as CustomEvent<{ action: ReadAloudCommand }>).detail?.action;
		if (action === 'toggle') togglePlayback();
		else if (action === 'stop') stop();
	});

	// Any scrolling by the reader (or the scroll-to-top button) pauses following.
	const unfollow = () => {
		follow = false;
	};
	window.addEventListener('wheel', unfollow, { passive: true });
	window.addEventListener('touchmove', unfollow, { passive: true });
	window.addEventListener('hakushi:user-scroll', unfollow);
	window.addEventListener('keydown', (e) => {
		if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) unfollow();
	});
	window.addEventListener('pagehide', () => synth.cancel());
}
