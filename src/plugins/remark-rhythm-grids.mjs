import { visit } from 'unist-util-visit';
import { parseFenceAttributes } from './fence-attributes.mjs';

/**
 * remark-rhythm-grids
 * Box notation for counts, cycles and accent patterns, ported from LibroMorph:
 *
 *   ```rhythm-grid
 *   Count:   12  1  2 | 3  4  5 | 6  7 | 8  9 |10 11
 *   Map A:    X  .  . | X  .  . | X  . | X  . | X  .
 *   ```
 *
 * Every line is "Label: cells". The first line is the header (the counts);
 * other rows are matched to its columns by character position, so grids
 * written for a monospaced font keep their meaning. `|` in the header marks a
 * group boundary. Cells: X strong, x light, o muted, . empty, - held from the
 * previous cell; anything else (F, Bb, "next cycle") is text. Text past the
 * last column becomes a note at the end of the row. `.circle` draws a clock
 * face instead of a table.
 *
 * A grid with `tempo=` also carries a generated percussion ABC tune that
 * src/scripts/abc.ts plays with abcjs, highlighting the sounding column.
 */

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const num = (value) => String(Math.round(value * 10) / 10);

const SYMBOLS = {
	X: { className: 'rg-strong', mark: '●', name: 'strong' },
	x: { className: 'rg-light', mark: '●', name: 'light' },
	o: { className: 'rg-muted', mark: '○', name: 'muted' },
};

export { parseFenceAttributes };

// Split chars[from..] into tokens {text, s, e} at spaces; "|" positions are returned separately.
function tokenize(chars, from) {
	const tokens = [];
	const bars = [];
	let cur = null;
	let start = 0;
	const flush = (i) => {
		if (cur !== null) tokens.push({ text: cur, s: start, e: i - 1 });
		cur = null;
	};
	for (let i = from; i < chars.length; i++) {
		const c = chars[i];
		if (c === ' ' || c === '\t') flush(i);
		else if (c === '|') {
			flush(i);
			bars.push(i);
		} else {
			if (cur === null) [cur, start] = ['', i];
			cur += c;
		}
	}
	flush(chars.length);
	return { tokens, bars };
}

function splitLabel(line) {
	const chars = Array.from(line);
	const colon = chars.indexOf(':');
	if (colon < 0) return null;
	const label = chars.slice(0, colon).join('').trim();
	return /^\p{L}/u.test(label) ? { label, chars, from: colon + 1 } : null;
}

const isWord = (text) => Array.from(text).length >= 3 && /^[A-Za-z(]/.test(text);

/** Parse a grid as LibroMorph's Lua filter does; throws with a readable message. */
export function parseRhythmGrid(text) {
	let header = null;
	const rows = [];
	for (const line of text.split(/\r?\n/)) {
		if (!/\S/.test(line)) continue;
		const split = splitLabel(line);
		if (!split) throw new Error(`line without a 'Label:' prefix: ${line}`);
		const { tokens, bars } = tokenize(split.chars, split.from);
		if (!header) {
			if (!tokens.length) throw new Error('the header row has no counts');
			header = { label: split.label, cols: tokens, groupStart: new Set() };
			for (const bar of bars) {
				const ci = tokens.findIndex((col) => col.s > bar);
				if (ci >= 0) header.groupStart.add(ci);
			}
		} else rows.push({ label: split.label, tokens });
	}
	if (!header) throw new Error('empty grid');
	if (!rows.length) throw new Error('no rows below the header');

	const { cols } = header;
	const lastEnd = cols[cols.length - 1].e;
	const columnFor = (tok) => {
		let best = 0;
		let bestD = Infinity;
		for (let ci = 0; ci < cols.length; ci++) {
			const col = cols[ci];
			if (tok.s <= col.e && tok.e >= col.s) return ci;
			const d = Math.abs((tok.s + tok.e) / 2 - (col.s + col.e) / 2);
			if (d < bestD) [best, bestD] = [ci, d];
		}
		return best;
	};

	for (const row of rows) {
		// Join multi-word phrases ("next cycle") separated by single spaces.
		const phrases = [];
		for (const tok of row.tokens) {
			const prev = phrases[phrases.length - 1];
			if (prev && tok.s === prev.e + 2 && isWord(prev.last) && isWord(tok.text)) {
				prev.text += ` ${tok.text}`;
				prev.e = tok.e;
				prev.last = tok.text;
			} else phrases.push({ ...tok, last: tok.text });
		}
		row.cells = new Map();
		const notes = [];
		for (const ph of phrases) {
			if (ph.s > lastEnd + 1) {
				notes.push(ph.text);
				continue;
			}
			const ci = columnFor(ph);
			const span = ph.text.includes(' ') ? Math.max(1, columnFor({ s: ph.e, e: ph.e }) - ci + 1) : 1;
			const existing = row.cells.get(ci);
			// "." only marks an empty cell, so it never merges with content.
			if (!existing || existing.text === '.') row.cells.set(ci, { text: ph.text, span });
			else if (ph.text !== '.') existing.text += ` ${ph.text}`;
		}
		row.note = notes.length ? notes.join(' ') : null;
		delete row.tokens;
	}
	return { header, rows };
}

function cellKind(text) {
	if (text === '.') return 'empty';
	if (text === '-' || text === '—' || text === '–') return 'hold';
	if (SYMBOLS[text]) return 'symbol';
	return 'text';
}

// Spoken names for header counts: subdivisions take their beat ("3&").
function countNames(cols) {
	let beat = '';
	return cols.map((col) => (/^\d/.test(col.text) ? (beat = col.text) : beat + col.text));
}

export function describeGrid(grid) {
	const names = countNames(grid.header.cols);
	const parts = [];
	for (const row of grid.rows) {
		const byKind = new Map(['strong', 'light', 'muted', 'held'].map((name) => [name, []]));
		grid.header.cols.forEach((_, ci) => {
			const cell = row.cells.get(ci);
			if (!cell) return;
			const kind = cellKind(cell.text);
			const name = kind === 'symbol' ? SYMBOLS[cell.text].name : kind === 'hold' ? 'held' : kind === 'text' ? cell.text : null;
			if (!name) return;
			if (!byKind.has(name)) byKind.set(name, []);
			byKind.get(name).push(names[ci]);
		});
		const bits = [...byKind].filter(([, at]) => at.length).map(([name, at]) => `${name} on ${at.join(', ')}`);
		if (bits.length) parts.push(`${row.label}: ${bits.join('; ')}`);
	}
	const counts = grid.header.cols.map((col) => col.text).join(' ');
	return `Rhythm grid, ${grid.header.label.toLowerCase()} ${counts}${parts.length ? `. ${parts.join('. ')}` : ''}`;
}

function legend(used) {
	const items = ['X', 'x', 'o'].filter((key) => used.has(key)).map((key) => `<span class="${SYMBOLS[key].className}">${SYMBOLS[key].mark}</span> ${SYMBOLS[key].name}`);
	if (used.has('hold')) items.push('<span class="rg-hold-sample"></span> held');
	return items.length ? `<p class="rg-legend">${items.join(' · ')}</p>` : '';
}

function gridTable(grid) {
	const used = new Set();
	const { cols, groupStart } = grid.header;
	const hasNote = grid.rows.some((row) => row.note);
	const cls = (ci, base) => base + (groupStart.has(ci) ? ' rg-group-start' : '');
	const out = ['<table class="rg-table">', `<thead><tr><th class="rg-label" scope="col">${esc(grid.header.label)}</th>`];
	cols.forEach((col, ci) => out.push(`<th class="${cls(ci, 'rg-count')}" scope="col" data-col="${ci}">${esc(col.text)}</th>`));
	if (hasNote) out.push('<th class="rg-note" scope="col"></th>');
	out.push('</tr></thead><tbody>');
	for (const row of grid.rows) {
		out.push(`<tr><th class="rg-label" scope="row">${esc(row.label)}</th>`);
		for (let ci = 0; ci < cols.length;) {
			const cell = row.cells.get(ci);
			const kind = cell ? cellKind(cell.text) : 'empty';
			const at = `data-col="${ci}"`;
			if (kind === 'empty') out.push(`<td class="${cls(ci, 'rg-cell rg-empty')}" ${at}></td>`);
			else if (kind === 'hold') {
				used.add('hold');
				out.push(`<td class="${cls(ci, 'rg-cell rg-hold')}" ${at}><span class="rg-hold-bar"></span></td>`);
			} else if (kind === 'symbol') {
				const sym = SYMBOLS[cell.text];
				used.add(cell.text);
				out.push(`<td class="${cls(ci, `rg-cell ${sym.className}`)}" ${at} title="${sym.name}">${sym.mark}</td>`);
			} else {
				const span = Math.min(cell.span, cols.length - ci);
				const wordy = span > 1 || /[a-z]{3}/.test(cell.text);
				out.push(`<td class="${cls(ci, `rg-cell rg-text${wordy ? ' rg-phrase' : ''}`)}" ${at}${span > 1 ? ` colspan="${span}" data-span="${span}"` : ''}>${esc(cell.text)}</td>`);
				ci += span;
				continue;
			}
			ci += 1;
		}
		if (hasNote) out.push(`<td class="rg-note">${esc(row.note ?? '')}</td>`);
		out.push('</tr>');
	}
	out.push('</tbody></table>');
	return { html: out.join(''), used };
}

// Clock face: counts around the outside, one ring per row (outermost first),
// ticks at group boundaries, the header's first count at the top.
function circleSvg(grid, description) {
	const { cols } = grid.header;
	const n = cols.length;
	const nrows = grid.rows.length;
	const [R_LABEL, R_OUTER, RING_GAP, cx, cy] = [132, 108, 26, 160, 152];
	const W = 320;
	const H = 304 + 18 * nrows + 8;
	const angle = (i) => -Math.PI / 2 + (2 * Math.PI * i) / n;
	const pos = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
	const fg = 'currentColor';
	const desc = esc(description);
	const out = [`<svg xmlns="http://www.w3.org/2000/svg" class="rg-circle-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${desc}" font-family="Helvetica, Arial, sans-serif"><title>${desc}</title>`];
	const rInner = R_OUTER - RING_GAP * (nrows - 1);
	for (let ri = 0; ri < nrows; ri++) out.push(`<circle cx="${cx}" cy="${cy}" r="${num(R_OUTER - RING_GAP * ri)}" fill="none" stroke="${fg}" stroke-opacity="0.3" stroke-width="1"/>`);
	// Group boundaries: radial ticks halfway before each group start; on a cycle the first count also starts a group.
	const starts = [...grid.header.groupStart];
	if (starts.length && !grid.header.groupStart.has(0)) starts.push(0);
	for (const ci of starts.sort((a, b) => a - b)) {
		const a = angle(ci - 0.5);
		out.push(`<line x1="${num(cx + (rInner - 14) * Math.cos(a))}" y1="${num(cy + (rInner - 14) * Math.sin(a))}" x2="${num(cx + (R_OUTER + 12) * Math.cos(a))}" y2="${num(cy + (R_OUTER + 12) * Math.sin(a))}" stroke="${fg}" stroke-width="2"/>`);
	}
	cols.forEach((col, ci) => {
		const [x, y] = pos(ci, R_LABEL);
		out.push(`<text class="rg-circle-count" data-col="${ci}" x="${num(x)}" y="${num(y)}" text-anchor="middle" dominant-baseline="central" font-size="15"${ci === 0 ? ' font-weight="bold"' : ''} fill="${fg}">${esc(col.text)}</text>`);
	});
	grid.rows.forEach((row, ri) => {
		const r = R_OUTER - RING_GAP * ri;
		for (let ci = 0; ci < n; ci++) {
			const [x, y] = pos(ci, r).map(num);
			const cell = row.cells.get(ci);
			const kind = cell ? cellKind(cell.text) : 'empty';
			const at = `data-col="${ci}"`;
			if (kind === 'symbol' && cell.text === 'X') out.push(`<circle ${at} cx="${x}" cy="${y}" r="9" fill="${fg}"/>`);
			else if (kind === 'symbol' && cell.text === 'x') out.push(`<circle ${at} cx="${x}" cy="${y}" r="5.5" fill="${fg}"/>`);
			else if (kind === 'symbol') out.push(`<circle ${at} cx="${x}" cy="${y}" r="7" fill="none" stroke="${fg}" stroke-width="2"/>`);
			else if (kind === 'hold') out.push(`<circle ${at} cx="${x}" cy="${y}" r="3.5" fill="none" stroke="${fg}" stroke-width="1.5"/>`);
			else if (kind === 'text') out.push(`<text ${at} x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="bold" fill="${fg}">${esc(cell.text)}</text>`);
			else out.push(`<circle ${at} cx="${x}" cy="${y}" r="1.8" fill="${fg}" fill-opacity="0.45"/>`);
		}
	});
	grid.rows.forEach((row, ri) => {
		const which = nrows === 1 ? '' : `${ri === 0 ? 'outer ring' : ri === nrows - 1 ? 'inner ring' : `ring ${ri + 1}`}: `;
		out.push(`<text x="${cx}" y="${304 + 18 * ri + 4}" text-anchor="middle" font-size="13" fill="${fg}">${which}${esc(row.label)}</text>`);
	});
	out.push('</svg>');
	return out.join('');
}

// ---------------------------------------------------------------------------
// Audio: a grid with tempo= becomes a hidden percussion ABC tune.
//   tempo=100         numbered counts per minute (unnumbered columns split their count)
//   play="A; B"       rows to sound: commas together, semicolons in turn
//                     (default: every row with X, x or o)
//   repeat=4          cycles of each group (default 4)
//   sound=claves      General MIDI percussion for every row, or per row:
//                     sound="Clave=claves, Surdo=low-tom" (default: clap)
//   count-in=6        counts of woodblock before the claps (default: the second
//                     half of the cycle, or the whole cycle with four counts or fewer)
// The woodblock keeps going under the claps as a practice click: high on every
// count named like the first header count, low on the others.
// ---------------------------------------------------------------------------

export const GRID_SOUNDS = {
	clap: 39, claves: 75, cowbell: 56, woodblock: 76, 'low-woodblock': 77,
	maracas: 70, cabasa: 69, tambourine: 54, 'side-stick': 37, 'bass-drum': 36,
	'low-tom': 41, 'high-tom': 50, conga: 63, 'low-conga': 64, 'muted-conga': 62,
	bongo: 60, 'low-bongo': 61, timbale: 65, 'low-timbale': 66, agogo: 67,
	'low-agogo': 68, triangle: 81, guiro: 74, 'short-guiro': 73, 'hi-hat': 42,
	'pedal-hi-hat': 44, ride: 51,
};
const GRID_CLAP = 39;
// X and x sit far apart: synthesizers change a clap's level only a little between neighbouring dynamics.
const GRID_DYNAMICS = { X: '!fff!', x: '!p!', o: '!pp!' };
const COUNT_IN = [76, 77]; // high / low wood block
const UNITS_PER_BEAT = 12; // L:1/48, so a quarter note is 12 units

function abcDrum(note) {
	const name = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'][note % 12];
	const octave = Math.floor(note / 12) - 1;
	return octave >= 5 ? name.toLowerCase() + "'".repeat(octave - 5) : name + ','.repeat(4 - octave);
}

/**
 * The percussion tune for a grid: `{ abc, columns }`, where `columns` maps the
 * character offset of every note and rest in `abc` to the grid column it sounds
 * on. Returns `{ error }` when the grid asks for audio but cannot have it, and
 * null when it has no tempo.
 */
export function rhythmGridToAbc(grid, attrs) {
	if (!attrs.tempo) return null;
	const tempo = Number(attrs.tempo);
	if (!Number.isFinite(tempo) || tempo <= 0) return { error: `tempo must be a positive number, not ${JSON.stringify(attrs.tempo)}` };
	const repeat = attrs.repeat ? Number(attrs.repeat) : 4;
	if (!Number.isInteger(repeat) || repeat < 1) return { error: `repeat must be a whole number of cycles, not ${JSON.stringify(attrs.repeat)}` };
	const { cols } = grid.header;

	// Each numbered count is one beat, shared equally with the unnumbered columns after it (1 & 2 &, 1 e & a).
	const beats = [];
	cols.forEach((col, i) => {
		if (/^\d/.test(col.text) || !beats.length) beats.push([i]);
		else beats[beats.length - 1].push(i);
	});
	const lengths = [];
	const beatStarts = new Set();
	for (const group of beats) {
		if (UNITS_PER_BEAT % group.length) return { error: `cannot divide a beat into ${group.length} columns` };
		beatStarts.add(group[0]);
		for (const i of group) lengths[i] = UNITS_PER_BEAT / group.length;
	}

	const symbolAt = (row, i) => {
		const text = row.cells.get(i)?.text;
		return text in GRID_DYNAMICS ? text : null;
	};
	const byLabel = new Map(grid.rows.map((row) => [row.label.toLowerCase(), row]));
	let groups;
	if (attrs.play) {
		groups = attrs.play.split(';').map((g) => g.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean)).filter((g) => g.length);
		const missing = groups.flat().filter((w) => !byLabel.has(w));
		if (missing.length) return { error: `play= names rows not in the grid: ${missing.join(', ')}` };
		groups = groups.map((g) => g.map((w) => byLabel.get(w)));
	} else {
		groups = [grid.rows.filter((row) => cols.some((_, i) => symbolAt(row, i)))];
	}
	if (!groups.some((g) => g.length)) return { error: 'no rows with X, x or o to play' };

	const sounds = new Map();
	let defaultSound = GRID_CLAP;
	for (const item of (attrs.sound ?? '').split(',').map((x) => x.trim()).filter(Boolean)) {
		const eq = item.lastIndexOf('=');
		const row = eq >= 0 ? item.slice(0, eq).trim().toLowerCase() : '';
		const name = item.slice(eq + 1).trim();
		const note = GRID_SOUNDS[name.toLowerCase()];
		if (note === undefined) return { error: `unknown sound "${name}"; choose from ${Object.keys(GRID_SOUNDS).join(', ')}` };
		if (row) {
			if (!byLabel.has(row)) return { error: `sound= names a row not in the grid: ${item.slice(0, eq).trim()}` };
			sounds.set(row, note);
		} else defaultSound = note;
	}

	let lead;
	if (attrs['count-in']) {
		lead = Number(attrs['count-in']);
		if (!Number.isInteger(lead)) return { error: `count-in must be a number of counts, not ${JSON.stringify(attrs['count-in'])}` };
	} else lead = beats.length > 4 ? beats.length - Math.floor(beats.length / 2) : beats.length;
	lead = Math.max(0, Math.min(lead, beats.length));
	const leadCols = beats.slice(beats.length - lead).flat();

	// Build the tune while recording where each note and rest starts.
	const columns = {};
	let abc = '';
	const text = (value) => { abc += value; };
	const token = (value, column) => {
		columns[abc.length] = column;
		// abcjs starts the first note after a bar line at the space before it.
		if (abc.endsWith(' ')) columns[abc.length - 1] = column;
		abc += value;
	};
	const tokens = (list) => list.forEach(([value, column], i) => {
		if (i) text(' ');
		token(value, column);
	});
	const first = cols[0].text;
	const click = (i) => {
		if (!beatStarts.has(i)) return [`z${lengths[i]}`, i];
		const hi = cols[i].text === first; // every count named like the first
		return [`${hi ? '!mf!' : '!mp!'}${abcDrum(COUNT_IN[hi ? 0 : 1])}${lengths[i]}`, i];
	};
	const pattern = (row, note) => cols.map((_, i) => {
		const sym = symbolAt(row, i);
		return [sym ? `${GRID_DYNAMICS[sym]}${abcDrum(note)}${lengths[i]}` : `z${lengths[i]}`, i];
	});
	const silent = cols.map((_, i) => [`z${lengths[i]}`, i]);
	const bars = (list) => list.forEach((cycle, i) => {
		if (i) text(' | ');
		tokens(cycle);
	});

	const voices = groups.flatMap((group, g) => group.map((row) => ({ g, row, note: sounds.get(row.label.toLowerCase()) ?? defaultSound })));
	const title = attrs.title || groups.map((group) => group.map((row) => row.label).join(', ')).join(' then ');
	text(`X:1\nT:${title.replace(/\n/g, ' ')}\nM:none\nL:1/48\nQ:1/4=${tempo}\n%%score (${voices.map((_, n) => `V${n}`).concat(`V${voices.length}`).join(' ')})\nK:C\n`);
	text('V:V0\n%%MIDI channel 10\n');
	if (leadCols.length) {
		tokens(leadCols.map(click));
		text(' | ');
	}
	bars(Array.from({ length: groups.length * repeat }, () => cols.map((_, i) => click(i))));
	text(' |]\n');
	voices.forEach(({ g, row, note }, n) => {
		text(`V:V${n + 1}\n%%MIDI channel 10\n`);
		if (leadCols.length) {
			tokens(leadCols.map((i) => [`z${lengths[i]}`, i]));
			text(' | ');
		}
		bars(groups.flatMap((_, h) => Array.from({ length: repeat }, () => (h === g ? pattern(row, note) : silent))));
		text(' |]\n');
	});
	return { abc, columns };
}

/** Render one grid block to HTML. `warn` receives build warnings. */
export function renderRhythmGrid(source, { classes = [], id = '', attrs = {} } = {}, warn = () => {}) {
	const idAttr = id ? ` id="${esc(id)}"` : '';
	let grid;
	try {
		grid = parseRhythmGrid(source);
	} catch (error) {
		warn(`rhythm grid: ${error.message}`);
		return `<div class="rhythm-grid rhythm-grid-error"${idAttr}><p class="rg-error">Could not draw rhythm grid: ${esc(error.message)}</p><pre class="rg-source"><code>${esc(source)}</code></pre></div>`;
	}
	const description = describeGrid(grid);
	const caption = attrs.title ? `<p class="rg-title">${esc(attrs.title)}</p>` : '';
	let audio = '';
	const tune = rhythmGridToAbc(grid, attrs);
	if (tune?.error) warn(`no playback for rhythm grid: ${tune.error}`);
	else if (tune) audio = ` data-rg-abc="${esc(tune.abc)}" data-rg-columns="${esc(JSON.stringify(tune.columns))}"`;
	if (classes.includes('circle')) {
		return `<div class="rhythm-grid rhythm-grid-circle"${idAttr}${audio}>${caption}${circleSvg(grid, description)}</div>`;
	}
	const table = gridTable(grid);
	return `<div class="rhythm-grid"${idAttr} role="group" aria-label="${esc(description)}"${audio}>${caption}<div class="rg-scroll">${table.html}</div>${legend(table.used)}</div>`;
}

export default function remarkRhythmGrids() {
	return (tree, file) => {
		visit(tree, 'code', (node, index, parent) => {
			if (!parent || typeof index !== 'number') return;
			const fence = parseFenceAttributes(node.lang, node.meta);
			if (!fence.classes.includes('rhythm-grid')) return;
			const where = file?.path ? ` in ${file.path}` : '';
			const warn = (message) => console.warn(`[hakushi] ${message}${where}`);
			parent.children[index] = { type: 'html', value: renderRhythmGrid(node.value, fence, warn) };
		});
	};
}
