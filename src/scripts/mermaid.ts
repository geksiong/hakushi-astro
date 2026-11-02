import config from 'virtual:hakushi/config';
import type { Mermaid } from 'mermaid';

// Render the <pre class="mermaid"> blocks emitted by remark-mermaid, in the
// configured light or dark theme. The site toggles dark mode with a `dark`
// class on <html>, so diagrams are re-rendered whenever that flips.

const options = config.mermaid;
const root = document.documentElement;

let mermaidPromise: Promise<Mermaid> | undefined;
let renderedDark: boolean | undefined;
let generation = 0;
let nextId = 0;

function loadMermaid() {
	mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => {
		if (options.iconPacks.length > 0) {
			mermaid.registerIconPacks(
				options.iconPacks.map((pack) =>
					'icons' in pack
						? { name: pack.name, icons: pack.icons as any }
						: { name: pack.name, loader: () => fetch(pack.url).then((res) => res.json()) }
				)
			);
		}
		return mermaid;
	});
	return mermaidPromise;
}

async function renderDiagrams() {
	const diagrams = [...document.querySelectorAll<HTMLElement>('pre.mermaid')];
	if (diagrams.length === 0) return;

	const dark = root.classList.contains('dark');
	if (dark === renderedDark) return;
	renderedDark = dark;
	// A theme switch while a pass is still rendering starts a new pass; the old one stops.
	const pass = ++generation;

	const mermaid = await loadMermaid();
	if (pass !== generation) return;
	mermaid.initialize({
		...options.mermaidConfig,
		startOnLoad: false,
		theme: dark ? options.darkTheme : options.theme,
	});

	for (const diagram of diagrams) {
		// Keep the source: rendering replaces the element's contents with the SVG.
		diagram.dataset.diagram ??= diagram.textContent ?? '';
		try {
			const { svg } = await mermaid.render(`mermaid-${nextId++}`, diagram.dataset.diagram);
			if (pass !== generation) return;
			diagram.innerHTML = svg;
			// Open the diagram in the zoomable viewer (src/scripts/lightbox.ts).
			diagram.dataset.lightbox = '';
			diagram.tabIndex = 0;
			diagram.setAttribute('role', 'button');
			diagram.setAttribute('aria-label', 'View diagram larger');
		} catch (error) {
			if (pass !== generation) return;
			console.error('Failed to render Mermaid diagram:', error);
			const message = document.createElement('p');
			message.className = 'mermaid-error';
			message.textContent = `Failed to render diagram: ${error instanceof Error ? error.message : String(error)}`;
			diagram.replaceChildren(message);
			delete diagram.dataset.lightbox;
			diagram.removeAttribute('tabindex');
			diagram.removeAttribute('role');
			diagram.removeAttribute('aria-label');
		}
		diagram.dataset.processed = 'true';
	}
}

new MutationObserver(() => void renderDiagrams()).observe(root, { attributes: true, attributeFilter: ['class'] });

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => void renderDiagrams());
} else {
	void renderDiagrams();
}
