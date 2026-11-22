/**
 * Hydrates ```abc2svg blocks (remark-abc) with abc2svg, which engraves some
 * things abcjs can't, such as jianpu (%%jianpu), tablature and Clairnote.
 *
 * abc2svg is a set of classic scripts sharing one `abc2svg` global, not ES
 * modules, so the core and its optional modules are loaded with <script>
 * tags, only on pages that have an abc2svg block. The core loads a module
 * when a tune uses its directive (abc2svg.modules.load), through the
 * abc2svg.loadjs hook defined here.
 */
import coreUrl from 'abc2svg/abc2svg-1.js?url';
import ambitus from 'abc2svg/ambitus-1.js?url';
import breakUrl from 'abc2svg/break-1.js?url';
import capo from 'abc2svg/capo-1.js?url';
import chordnames from 'abc2svg/chordnames-1.js?url';
import clair from 'abc2svg/clair-1.js?url';
import clip from 'abc2svg/clip-1.js?url';
import combine from 'abc2svg/combine-1.js?url';
import diag from 'abc2svg/diag-1.js?url';
import equalbars from 'abc2svg/equalbars-1.js?url';
import grid from 'abc2svg/grid-1.js?url';
import grid2 from 'abc2svg/grid2-1.js?url';
import grid3 from 'abc2svg/grid3-1.js?url';
import jazzchord from 'abc2svg/jazzchord-1.js?url';
import jianpu from 'abc2svg/jianpu-1.js?url';
import mdnn from 'abc2svg/mdnn-1.js?url';
import midi from 'abc2svg/MIDI-1.js?url';
import nns from 'abc2svg/nns-1.js?url';
import page from 'abc2svg/page-1.js?url';
import pedline from 'abc2svg/pedline-1.js?url';
import perc from 'abc2svg/perc-1.js?url';
import psvg from 'abc2svg/psvg-1.js?url';
import roman from 'abc2svg/roman-1.js?url';
import soloffs from 'abc2svg/soloffs-1.js?url';
import sth from 'abc2svg/sth-1.js?url';
import strtab from 'abc2svg/strtab-1.js?url';
import temper from 'abc2svg/temper-1.js?url';

/** Module file names as abc2svg asks for them → their served URLs. */
const MODULE_URLS: Record<string, string> = {
	'ambitus-1.js': ambitus,
	'break-1.js': breakUrl,
	'capo-1.js': capo,
	'chordnames-1.js': chordnames,
	'clair-1.js': clair,
	'clip-1.js': clip,
	'combine-1.js': combine,
	'diag-1.js': diag,
	'equalbars-1.js': equalbars,
	'grid-1.js': grid,
	'grid2-1.js': grid2,
	'grid3-1.js': grid3,
	'jazzchord-1.js': jazzchord,
	'jianpu-1.js': jianpu,
	'mdnn-1.js': mdnn,
	'MIDI-1.js': midi,
	'nns-1.js': nns,
	'page-1.js': page,
	'pedline-1.js': pedline,
	'perc-1.js': perc,
	'psvg-1.js': psvg,
	'roman-1.js': roman,
	'soloffs-1.js': soloffs,
	'sth-1.js': sth,
	'strtab-1.js': strtab,
	'temper-1.js': temper,
};

type Abc2svgUser = {
	img_out: (svg: string) => void;
	errmsg: (message: string, line?: number, column?: number) => void;
};

type Abc2svgGlobal = {
	Abc: new (user: Abc2svgUser) => { tosvg: (name: string, source: string) => void };
	modules: { load: (source: string, relay: () => void, errmsg?: (message: string) => void) => boolean };
	loadjs: (file: string, onload?: () => void, onerror?: () => void) => void;
	abc_end?: () => void;
};

declare global {
	interface Window {
		abc2svg?: Abc2svgGlobal;
		/** Some modules (strtab, page) read the current renderer callbacks from a global `user`. */
		user?: Abc2svgUser;
	}
}

function loadScript(src: string, onload?: () => void, onerror?: () => void) {
	const script = document.createElement('script');
	script.src = src;
	if (onload) script.onload = onload;
	script.onerror = onerror ?? (() => console.error(`Failed to load ${src}`));
	document.head.appendChild(script);
}

let core: Promise<Abc2svgGlobal> | null = null;

function loadCore(): Promise<Abc2svgGlobal> {
	core ??= new Promise((resolve, reject) => {
		loadScript(
			coreUrl,
			() => {
				const abc2svg = window.abc2svg;
				if (!abc2svg?.Abc) return reject(new Error('abc2svg did not initialise'));
				abc2svg.loadjs = (file, onload, onerror) => {
					const url = MODULE_URLS[file];
					if (url) loadScript(url, onload, onerror);
					else onerror?.();
				};
				abc2svg.abc_end = () => {};
				resolve(abc2svg);
			},
			() => reject(new Error('Failed to load abc2svg')),
		);
	});
	return core;
}

/** Resolves once every module the tune's directives need is loaded. */
function loadModules(abc2svg: Abc2svgGlobal, source: string, warn: (message: string) => void): Promise<void> {
	return new Promise((resolve) => {
		let done = false;
		const relay = () => {
			if (!done) {
				done = true;
				resolve();
			}
		};
		if (abc2svg.modules.load(source, relay, warn)) relay();
	});
}

function showError(el: HTMLElement, message: string) {
	const fallback = document.createElement('p');
	fallback.className = 'abc-invalid';
	fallback.textContent = message;
	el.replaceChildren(fallback);
}

let tuneCount = 0;

async function render(abc2svg: Abc2svgGlobal, el: HTMLElement) {
	// Each Abc instance resets abc2svg's one shared stylesheet and numbers its
	// font classes from .f0, which would strip earlier scores of their music
	// font. %%fullsvg writes each tune's styles into its own SVG instead, with
	// the given suffix on its class names and ids so tunes don't clash.
	const source = `%%fullsvg _h${tuneCount++}\n${el.dataset.abc2svg!}`;
	const warnings: string[] = [];
	const warn = (message: string) => warnings.push(message);
	await loadModules(abc2svg, source, warn);

	let svg = '';
	const user: Abc2svgUser = { img_out: (out) => (svg += out), errmsg: warn };
	window.user = user;
	new abc2svg.Abc(user).tosvg('hakushi', source);
	if (warnings.length) console.warn('abc2svg:\n' + warnings.join('\n'));
	if (!svg) return showError(el, 'Failed to render ABC notation.');
	// abc2svg returns one <svg> per music line (plus one for the title block).
	el.innerHTML = svg;
}

async function mountAbc2svgBlocks() {
	const blocks = [...document.querySelectorAll<HTMLElement>('.abc-body[data-abc2svg]')].filter((el) => {
		if (el.dataset.mounted === 'true' || !el.dataset.abc2svg) return false;
		el.dataset.mounted = 'true';
		return true;
	});
	if (blocks.length === 0) return;

	let abc2svg: Abc2svgGlobal;
	try {
		abc2svg = await loadCore();
	} catch (err) {
		console.error(err);
		blocks.forEach((el) => showError(el, 'Failed to load the abc2svg renderer.'));
		return;
	}
	// One at a time: abc2svg keeps per-tune state on its module globals.
	for (const el of blocks) {
		try {
			await render(abc2svg, el);
		} catch (err) {
			console.error('Failed to render ABC notation with abc2svg:', err);
			showError(el, 'Failed to render ABC notation.');
		}
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', mountAbc2svgBlocks);
} else {
	mountAbc2svgBlocks();
}
