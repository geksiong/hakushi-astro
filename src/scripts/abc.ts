import abcjs from 'abcjs';

const PLAYING_CLASS = 'abc-note-playing';

/** Only one score plays at a time: starting one pauses whichever was playing. */
let activeController: abcjs.SynthObjectController | null = null;

type Highlighter = { show: (event: abcjs.NoteTimingEvent) => void; clear: () => void };

/** Notes under the playback cursor in a rendered score. */
function noteHighlighter(body: HTMLElement): Highlighter {
	const clear = () => body.querySelectorAll(`.${PLAYING_CLASS}`).forEach((n) => n.classList.remove(PLAYING_CLASS));
	return {
		clear,
		show(event) {
			clear();
			event.elements?.forEach((group) => group.forEach((n) => n.classList.add(PLAYING_CLASS)));
		},
	};
}

function createCursor(highlight: Highlighter, controller: () => abcjs.SynthObjectController): abcjs.CursorControl {
	return {
		beatSubDivision: 2,
		onStart() {
			const self = controller();
			if (activeController && activeController !== self) activeController.pause();
			activeController = self;
		},
		onEvent: (event) => highlight.show(event),
		onFinished() {
			highlight.clear();
			if (activeController === controller()) activeController = null;
		},
	};
}

/** Attach play / loop / restart / progress / tempo controls to a block. */
function mountPlayback(block: HTMLElement, highlight: Highlighter, tune: abcjs.TuneObject) {
	const audio = document.createElement('div');
	audio.className = 'abc-audio';
	block.appendChild(audio);

	let controller: abcjs.SynthObjectController;
	const cursor = createCursor(highlight, () => controller);
	controller = new abcjs.synth.SynthController();
	controller.load(audio, cursor, {
		displayLoop: true,
		displayRestart: true,
		displayPlay: true,
		displayProgress: true,
		displayWarp: true,
	});
	controller.setTune(tune, false).catch((err) => {
		console.error('Failed to prepare ABC playback:', err);
		audio.remove();
	});
}

/**
 * Rhythm grids with a tempo carry a generated percussion tune (remark-rhythm-grids)
 * and a map from each note's position in it to the grid column it sounds on.
 */
function mountRhythmGrids(canPlay: boolean) {
	if (!canPlay) return;
	document.querySelectorAll<HTMLElement>('.rhythm-grid[data-rg-abc]').forEach((grid) => {
		if (grid.dataset.mounted === 'true') return;
		grid.dataset.mounted = 'true';
		try {
			const columns: Record<string, number> = JSON.parse(grid.dataset.rgColumns || '{}');
			// The tune is never shown; render it off-page for abcjs' timing data.
			const hidden = document.createElement('div');
			hidden.hidden = true;
			grid.appendChild(hidden);
			const [tune] = abcjs.renderAbc(hidden, grid.dataset.rgAbc!);
			const cells = [...grid.querySelectorAll<Element>('[data-col]')].map((el) => {
				const start = Number(el.getAttribute('data-col'));
				return { el, start, end: start + Number(el.getAttribute('data-span') || 1) };
			});
			let current = -1;
			const clear = () => {
				current = -1;
				cells.forEach(({ el }) => el.classList.remove('rg-playing'));
			};
			const highlight: Highlighter = {
				clear,
				show(event) {
					const column = (event.startCharArray ?? [event.startChar]).map((at) => (at == null ? undefined : columns[at])).find((c) => c !== undefined);
					if (column === undefined || column === current) return;
					current = column;
					cells.forEach(({ el, start, end }) => el.classList.toggle('rg-playing', column >= start && column < end));
				},
			};
			if (tune) mountPlayback(grid, highlight, tune);
		} catch (err) {
			console.error('Failed to prepare rhythm grid playback:', err);
		}
	});
}

// Hydrate all ```abc placeholders rendered by remark-abc.
function mountAbcBlocks() {
	const canPlay = abcjs.synth.supportsAudio();
	document.querySelectorAll<HTMLElement>('.abc-body[data-abc]').forEach((el) => {
		if (el.dataset.mounted === 'true') return;
		el.dataset.mounted = 'true';
		try {
			const [tune] = abcjs.renderAbc(el, el.dataset.abc!, { responsive: 'resize', add_classes: true });
			const block = el.closest<HTMLElement>('.abc-block');
			if (canPlay && tune && block && tune.lines.length > 0) mountPlayback(block, noteHighlighter(el), tune);
		} catch (err) {
			console.error('Failed to render ABC notation:', err);
			const fallback = document.createElement('p');
			fallback.className = 'abc-invalid';
			fallback.textContent = 'Failed to render ABC notation.';
			el.replaceChildren(fallback);
		}
	});
	mountRhythmGrids(canPlay);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', mountAbcBlocks);
} else {
	mountAbcBlocks();
}
