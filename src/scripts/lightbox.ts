// Full-screen viewer for article images and rendered Mermaid diagrams, with
// wheel / pinch zoom, drag panning and keyboard controls.
//
// Anything carrying a `data-lightbox` attribute opens the viewer. Images in
// the article body are marked here; src/scripts/mermaid.ts marks diagrams once
// they have rendered, and ArticleView marks the main image.

const MIN_ZOOM_FACTOR = 0.25; // relative to the fitted scale
const MAX_SCALE = 12; // relative to the content's natural size
const STEP = 1.25;
const PAN_STEP = 60;
const DRAG_THRESHOLD = 4;

const icon = (body: string) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const ICONS = {
	zoomIn: icon('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>'),
	zoomOut: icon('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M8 11h6"/>'),
	reset: icon('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
	close: icon('<path d="M18 6 6 18M6 6l12 12"/>'),
};

interface View {
	dialog: HTMLDialogElement;
	stage: HTMLElement;
	content: HTMLElement;
	caption: HTMLElement;
	level: HTMLElement;
}

let view: View | undefined;
let width = 0;
let height = 0;
let scale = 1;
let x = 0;
let y = 0;
let fitScale = 1;
let fitted = true;

const pointers = new Map<number, { x: number; y: number }>();
let pinchDistance = 0;
let dragDistance = 0;
let downOnBackdrop = false;

function button(label: string, svg: string, onClick: () => void) {
	const el = document.createElement('button');
	el.type = 'button';
	el.className = 'lightbox-btn';
	el.title = label;
	el.setAttribute('aria-label', label);
	el.innerHTML = svg;
	el.addEventListener('click', onClick);
	return el;
}

function buildView(): View {
	const dialog = document.createElement('dialog');
	dialog.className = 'lightbox';
	dialog.setAttribute('aria-label', 'Image viewer');
	dialog.tabIndex = -1;

	const stage = document.createElement('div');
	stage.className = 'lightbox-stage';

	const content = document.createElement('div');
	content.className = 'lightbox-content';
	stage.append(content);

	const level = document.createElement('span');
	level.className = 'lightbox-level';
	level.setAttribute('aria-live', 'polite');

	const toolbar = document.createElement('div');
	toolbar.className = 'lightbox-toolbar';
	toolbar.append(
		button('Zoom out (−)', ICONS.zoomOut, () => zoomCentered(1 / STEP)),
		level,
		button('Zoom in (+)', ICONS.zoomIn, () => zoomCentered(STEP)),
		button('Fit to screen (0)', ICONS.reset, fit),
		button('Close (Esc)', ICONS.close, close)
	);

	const caption = document.createElement('p');
	caption.className = 'lightbox-caption';

	dialog.append(stage, toolbar, caption);
	document.body.append(dialog);

	dialog.addEventListener('close', onClosed);
	dialog.addEventListener('keydown', onKeyDown);
	stage.addEventListener('wheel', onWheel, { passive: false });
	stage.addEventListener('pointerdown', onPointerDown);
	stage.addEventListener('pointermove', onPointerMove);
	stage.addEventListener('pointerup', onPointerUp);
	stage.addEventListener('pointercancel', onPointerUp);
	stage.addEventListener('dblclick', onDoubleClick);
	window.addEventListener('resize', () => {
		if (dialog.open && fitted) fit();
	});

	return { dialog, stage, content, caption, level };
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

function minScale() {
	return Math.min(fitScale, 1) * MIN_ZOOM_FACTOR;
}

function maxScale() {
	return Math.max(MAX_SCALE, fitScale * 4);
}

function apply() {
	if (!view) return;
	view.content.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
	view.level.textContent = `${Math.round(scale * 100)}%`;
}

function fit() {
	if (!view) return;
	const rect = view.stage.getBoundingClientRect();
	const pad = Math.min(48, rect.width * 0.05);
	fitScale = Math.min((rect.width - pad * 2) / width, (rect.height - pad * 2) / height);
	// Don't blow small bitmaps up past their natural size; vector content may grow a little.
	fitScale = Math.min(fitScale, view.content.dataset.kind === 'image' ? 1 : 2);
	scale = fitScale;
	x = (rect.width - width * scale) / 2;
	y = (rect.height - height * scale) / 2;
	fitted = true;
	apply();
}

/** Zoom by `factor`, keeping the stage point (cx, cy) fixed under the cursor. */
function zoomAt(factor: number, cx: number, cy: number) {
	const next = Math.min(maxScale(), Math.max(minScale(), scale * factor));
	if (next === scale) return;
	x = cx - (cx - x) * (next / scale);
	y = cy - (cy - y) * (next / scale);
	scale = next;
	fitted = false;
	apply();
}

function zoomCentered(factor: number) {
	if (!view) return;
	const rect = view.stage.getBoundingClientRect();
	zoomAt(factor, rect.width / 2, rect.height / 2);
}

function pan(dx: number, dy: number) {
	x += dx;
	y += dy;
	fitted = false;
	apply();
}

function stagePoint(event: { clientX: number; clientY: number }) {
	const rect = view!.stage.getBoundingClientRect();
	return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

function onWheel(event: WheelEvent) {
	event.preventDefault();
	const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY;
	// Trackpad pinches arrive as ctrl+wheel with small deltas; zoom them faster.
	const speed = event.ctrlKey ? 0.01 : 0.002;
	const point = stagePoint(event);
	zoomAt(Math.exp(-delta * speed), point.x, point.y);
}

function onPointerDown(event: PointerEvent) {
	if (event.button !== 0) return;
	view!.stage.setPointerCapture(event.pointerId);
	pointers.set(event.pointerId, stagePoint(event));
	if (pointers.size === 1) {
		dragDistance = 0;
		// Pointer capture retargets later events to the stage, so note where the press began.
		downOnBackdrop = !view!.content.contains(event.target as Node);
	}
	if (pointers.size === 2) {
		const [a, b] = [...pointers.values()];
		pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
	}
	view!.stage.classList.add('is-dragging');
}

function onPointerMove(event: PointerEvent) {
	const previous = pointers.get(event.pointerId);
	if (!previous) return;
	const point = stagePoint(event);

	if (pointers.size === 1) {
		dragDistance += Math.hypot(point.x - previous.x, point.y - previous.y);
		pan(point.x - previous.x, point.y - previous.y);
		pointers.set(event.pointerId, point);
		return;
	}

	// Pinch: zoom by the change in finger distance around their midpoint, and
	// pan by half this finger's movement (the midpoint moves half as far).
	pointers.set(event.pointerId, point);
	const [a, b] = [...pointers.values()];
	const distance = Math.hypot(a.x - b.x, a.y - b.y);
	dragDistance += DRAG_THRESHOLD;
	if (pinchDistance > 0) zoomAt(distance / pinchDistance, (a.x + b.x) / 2, (a.y + b.y) / 2);
	pan((point.x - previous.x) / 2, (point.y - previous.y) / 2);
	pinchDistance = distance;
}

function onPointerUp(event: PointerEvent) {
	if (!pointers.delete(event.pointerId)) return;
	if (pointers.size < 2) pinchDistance = 0;
	if (pointers.size > 0) return;
	view!.stage.classList.remove('is-dragging');
	// A plain click on the empty backdrop closes the viewer.
	if (event.type === 'pointerup' && dragDistance < DRAG_THRESHOLD && downOnBackdrop) {
		close();
	}
}

function onDoubleClick(event: MouseEvent) {
	const point = stagePoint(event);
	if (scale > fitScale * 1.05) fit();
	else zoomAt(2.5, point.x, point.y);
}

function onKeyDown(event: KeyboardEvent) {
	if (event.target instanceof HTMLButtonElement && (event.key === 'Enter' || event.key === ' ')) return;
	switch (event.key) {
		case '+':
		case '=':
			zoomCentered(STEP);
			break;
		case '-':
		case '_':
			zoomCentered(1 / STEP);
			break;
		case '0':
			fit();
			break;
		case 'ArrowLeft':
			pan(PAN_STEP, 0);
			break;
		case 'ArrowRight':
			pan(-PAN_STEP, 0);
			break;
		case 'ArrowUp':
			pan(0, PAN_STEP);
			break;
		case 'ArrowDown':
			pan(0, -PAN_STEP);
			break;
		default:
			return;
	}
	event.preventDefault();
}

// ---------------------------------------------------------------------------
// Open / close
// ---------------------------------------------------------------------------

function svgSize(svg: SVGSVGElement) {
	const box = svg.viewBox.baseVal;
	if (box && box.width > 0 && box.height > 0) return { width: box.width, height: box.height };
	const rect = svg.getBoundingClientRect();
	return { width: rect.width, height: rect.height };
}

async function contentFor(trigger: HTMLElement) {
	const img = trigger instanceof HTMLImageElement ? trigger : trigger.querySelector('img');
	if (img) {
		const copy = new Image();
		copy.src = img.currentSrc || img.src;
		copy.alt = img.alt;
		copy.draggable = false;
		await copy.decode().catch(() => undefined);
		const rect = img.getBoundingClientRect();
		let w = copy.naturalWidth || rect.width;
		let h = copy.naturalHeight || rect.height;
		const vector = /\.svgz?(?:[?#]|$)/i.test(copy.src) || copy.src.startsWith('data:image/svg');
		if (vector) {
			// An SVG's "natural" size is just its width/height attributes, often smaller than
			// it is shown inline; start from the larger of the two so it stays crisp.
			const grow = Math.min(rect.width / w, rect.height / h);
			if (grow > 1) {
				w *= grow;
				h *= grow;
			}
		}
		return { kind: vector ? 'vector' : 'image', node: copy, width: w, height: h, caption: img.alt };
	}

	const svg = trigger.querySelector('svg');
	if (!svg) return undefined;
	const size = svgSize(svg);
	const copy = svg.cloneNode(true) as SVGSVGElement;
	// Mermaid caps its SVGs with an inline max-width; size the copy explicitly instead.
	copy.removeAttribute('style');
	copy.setAttribute('width', String(size.width));
	copy.setAttribute('height', String(size.height));
	return { kind: 'diagram', node: copy, width: size.width, height: size.height, caption: '' };
}

async function open(trigger: HTMLElement) {
	const item = await contentFor(trigger);
	if (!item || item.width <= 0 || item.height <= 0) return;

	view ??= buildView();
	width = item.width;
	height = item.height;
	view.content.dataset.kind = item.kind;
	view.content.style.width = `${width}px`;
	view.content.style.height = `${height}px`;
	view.content.replaceChildren(item.node);
	view.caption.textContent = item.caption;
	view.caption.hidden = !item.caption;
	view.dialog.setAttribute('aria-label', item.kind === 'diagram' ? 'Diagram viewer' : 'Image viewer');

	document.documentElement.classList.add('lightbox-open');
	view.dialog.showModal();
	// Focus the dialog itself rather than the first toolbar button, so keys pan and zoom.
	view.dialog.focus();
	fit();
}

function close() {
	view?.dialog.close();
}

function onClosed() {
	pointers.clear();
	view?.content.replaceChildren();
	document.documentElement.classList.remove('lightbox-open');
}

// ---------------------------------------------------------------------------
// Triggers
// ---------------------------------------------------------------------------

function markImages() {
	document.querySelectorAll<HTMLImageElement>('.md-body img:not([data-lightbox])').forEach((img) => {
		// Linked images keep their link behaviour.
		if (img.closest('a')) return;
		img.dataset.lightbox = '';
	});
	document.querySelectorAll<HTMLElement>('[data-lightbox]:not([tabindex])').forEach((el) => {
		el.tabIndex = 0;
		el.setAttribute('role', 'button');
		if (!el.hasAttribute('aria-label')) {
			const alt = el instanceof HTMLImageElement ? el.alt : '';
			el.setAttribute('aria-label', alt ? `View image: ${alt}` : 'View larger');
		}
	});
}

function triggerFor(target: EventTarget | null) {
	if (!(target instanceof Element)) return undefined;
	// Let links inside diagrams (Mermaid `click` directives) work normally.
	if (target.closest('a')) return undefined;
	return target.closest<HTMLElement>('[data-lightbox]') ?? undefined;
}

document.addEventListener('click', (event) => {
	const trigger = triggerFor(event.target);
	if (!trigger || view?.dialog.contains(trigger)) return;
	event.preventDefault();
	void open(trigger);
});

document.addEventListener('keydown', (event) => {
	if (event.key !== 'Enter' && event.key !== ' ') return;
	const trigger = triggerFor(event.target);
	if (!trigger || trigger !== event.target) return;
	event.preventDefault();
	void open(trigger);
});

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', markImages);
} else {
	markImages();
}
