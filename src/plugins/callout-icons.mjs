// Raw lucide SVGs (via lucide-static), shared by the markdown plugins.
import { loadIcon } from './load-icon.mjs';
const infoSvg = loadIcon('info');
const lightbulbSvg = loadIcon('lightbulb');
const triangleAlertSvg = loadIcon('triangle-alert');
const shieldAlertSvg = loadIcon('shield-alert');
const circleAlertSvg = loadIcon('circle-alert');
const messageSquareQuoteSvg = loadIcon('message-square-quote');
const circleCheckBigSvg = loadIcon('circle-check-big');

export {
	infoSvg,
	lightbulbSvg,
	triangleAlertSvg,
	shieldAlertSvg,
	circleAlertSvg,
	messageSquareQuoteSvg,
	circleCheckBigSvg,
};

/** Resize + tag a raw lucide svg for use inside callout titles. */
export function calloutIcon(raw) {
	return raw
		.replace('width="24"', 'width="20"')
		.replace('height="24"', 'height="20"')
		.replace('<svg', '<svg class="callout-icon" aria-hidden="true"');
}
