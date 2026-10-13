import { readFileSync } from 'node:fs';

/** Load an SVG dependency at config time without relying on Vite's `?raw` transform. */
export function loadIcon(name) {
	return readFileSync(new URL(import.meta.resolve(`lucide-static/icons/${name}.svg`)), 'utf8');
}
