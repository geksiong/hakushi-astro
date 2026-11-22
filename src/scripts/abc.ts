import abcjs from 'abcjs';

const PLAYING_CLASS = 'abc-note-playing';

/** Only one score plays at a time: starting one pauses whichever was playing. */
let activeController: abcjs.SynthObjectController | null = null;

/** Highlights the notes under the playback cursor. */
function createCursor(body: HTMLElement, controller: () => abcjs.SynthObjectController): abcjs.CursorControl {
	const clear = () => {
		body.querySelectorAll(`.${PLAYING_CLASS}`).forEach((n) => n.classList.remove(PLAYING_CLASS));
	};
	return {
		beatSubDivision: 2,
		onStart() {
			const self = controller();
			if (activeController && activeController !== self) activeController.pause();
			activeController = self;
		},
		onEvent(event) {
			clear();
			event.elements?.forEach((group) => group.forEach((n) => n.classList.add(PLAYING_CLASS)));
		},
		onFinished() {
			clear();
			if (activeController === controller()) activeController = null;
		},
	};
}

/** Attach play / loop / restart / progress / tempo controls below a rendered tune. */
function mountPlayback(block: HTMLElement, body: HTMLElement, tune: abcjs.TuneObject) {
	const audio = document.createElement('div');
	audio.className = 'abc-audio';
	block.appendChild(audio);

	let controller: abcjs.SynthObjectController;
	const cursor = createCursor(body, () => controller);
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

// Hydrate all ```abc placeholders rendered by remark-abc.
function mountAbcBlocks() {
	const canPlay = abcjs.synth.supportsAudio();
	document.querySelectorAll<HTMLElement>('.abc-body[data-abc]').forEach((el) => {
		if (el.dataset.mounted === 'true') return;
		el.dataset.mounted = 'true';
		try {
			const [tune] = abcjs.renderAbc(el, el.dataset.abc!, { responsive: 'resize', add_classes: true });
			const block = el.closest<HTMLElement>('.abc-block');
			if (canPlay && tune && block && tune.lines.length > 0) mountPlayback(block, el, tune);
		} catch (err) {
			console.error('Failed to render ABC notation:', err);
			const fallback = document.createElement('p');
			fallback.className = 'abc-invalid';
			fallback.textContent = 'Failed to render ABC notation.';
			el.replaceChildren(fallback);
		}
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', mountAbcBlocks);
} else {
	mountAbcBlocks();
}
