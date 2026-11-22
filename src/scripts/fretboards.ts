import fretboardUrl from './vendor/fretboard.umd.js?url';
import fretdromUrl from './vendor/fretdrom.min.js?url';

type FretboardSpec = { title?: string; tuning?: string[]; fretCount?: number; scale?: { root: string; type: string }; dots?: { string: number; fret: number; label?: string }[] };
type FretboardInstance = { renderScale: (scale: FretboardSpec['scale']) => void; style: (opts: unknown) => void; setDots: (dots: FretboardSpec['dots']) => FretboardInstance; render: () => void };
declare global {
	interface Window {
		fretboard: { Fretboard: new (opts: unknown) => FretboardInstance };
		FretDrom: { renderSVG: (source: string) => string };
	}
}

const scripts = new Map<string, Promise<void>>();
function loadScript(url: string): Promise<void> {
	if (!scripts.has(url)) scripts.set(url, new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = url;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Could not load diagram renderer.'));
		document.head.append(script);
	}));
	return scripts.get(url)!;
}

type Dot = { label?: string | number; note?: string };

// fretboard.js scale dots carry a note name such as "Bb" or "F#".
function dotLabel(dot: Dot): string {
	if (dot.label != null) return String(dot.label);
	if (typeof dot.note === 'string') return dot.note.charAt(0) + dot.note.slice(1).replace(/#/g, '♯').replace(/b/g, '♭');
	return '';
}

function renderFretboard(target: HTMLElement, source: string) {
	const spec = JSON.parse(source) as FretboardSpec;
	const tuning = spec.tuning ?? ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
	if (!Array.isArray(tuning) || tuning.length < 2 || tuning.length > 12 || tuning.some((note) => typeof note !== 'string')) throw new Error('Tuning must contain 2 to 12 strings.');
	const fretCount = spec.fretCount ?? 15;
	if (!Number.isInteger(fretCount) || fretCount < 1 || fretCount > 35) throw new Error('fretCount must be from 1 to 35.');
	const color = getComputedStyle(target).color;
	// The SVG scales to the column width, so size the drawing to the fret count
	// and scale dots, text and padding with it to keep labels readable.
	const width = Math.max(600, fretCount * 50);
	const k = width / 600;
	const board = new window.fretboard.Fretboard({
		el: target, tuning, stringCount: tuning.length, fretCount,
		width, height: Math.round(32 * k) * (tuning.length - 1),
		dotSize: 29 * k, dotTextSize: 17 * k, dotStrokeWidth: 2 * k,
		topPadding: 28 * k, bottomPadding: 15 * k, leftPadding: 32 * k, rightPadding: 24 * k,
		fretNumbersHeight: 40 * k, fretNumbersMargin: 24 * k,
		stringColor: color, fretColor: color, nutColor: color, fretNumbersColor: color,
		// fretboard.js draws the 12th fret in red; keep its extra width as an octave marker, in the page color.
		middleFretColor: color,
		dotStrokeColor: color, dotFill: '#fff', dotText: dotLabel,
	});
	if (spec.scale) {
		if (typeof spec.scale.root !== 'string' || typeof spec.scale.type !== 'string') throw new Error('scale needs root and type.');
		board.renderScale(spec.scale);
		board.style({ filter: { interval: '1P' }, fill: '#b91c1c', text: dotLabel, fontFill: '#fff' });
	} else if (Array.isArray(spec.dots)) {
		for (const dot of spec.dots) if (!Number.isInteger(dot.string) || dot.string < 1 || dot.string > tuning.length || !Number.isInteger(dot.fret) || dot.fret < 0 || dot.fret > fretCount) throw new Error('Dots need valid string and fret positions.');
		board.setDots(spec.dots).render();
	} else throw new Error('Provide scale or dots.');
	const svg = target.querySelector('svg');
	if (svg) {
		svg.querySelector('.fret-numbers')?.setAttribute('font-size', String(16 * k));
		// Two-character labels such as "B♭" or "♭7" fit a dot at full size; longer ones would overflow it.
		svg.querySelectorAll('.dot-text').forEach((text) => {
			if ((text.textContent ?? '').length >= 3) text.setAttribute('font-size', String(13 * k));
		});
		svg.setAttribute('role', 'img');
		svg.setAttribute('aria-label', spec.title || 'Fretboard diagram');
	}
}

function renderFretdrom(target: HTMLElement, source: string) {
	const markup = window.FretDrom.renderSVG(source);
	// SVG loaded as an image does not execute embedded scripts or event handlers.
	const image = document.createElement('img');
	image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
	image.alt = target.getAttribute('aria-label') || 'Fretdrom diagram';
	target.append(image);
}

async function initFretboards() {
	for (const figure of document.querySelectorAll<HTMLElement>('.fret-diagram[data-fret-kind]')) {
		if (figure.dataset.wired) continue;
		figure.dataset.wired = 'true';
		const target = figure.querySelector<HTMLElement>('.fret-render');
		if (!target) continue;
		try {
			if (figure.dataset.fretKind === 'fretboard') {
				await loadScript(fretboardUrl);
				renderFretboard(target, figure.dataset.fretSource || '');
			} else {
				await loadScript(fretdromUrl);
				renderFretdrom(target, figure.dataset.fretSource || '');
			}
		} catch (error) {
			const message = document.createElement('p');
			message.className = 'fret-render-error';
			message.textContent = `Could not draw fretboard: ${error instanceof Error ? error.message : String(error)}`;
			target.replaceChildren(message);
		}
	}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFretboards);
else initFretboards();
