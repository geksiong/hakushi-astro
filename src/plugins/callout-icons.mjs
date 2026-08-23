// Raw lucide SVGs (via lucide-static), shared by the markdown plugins.
import infoSvg from 'lucide-static/icons/info.svg?raw';
import lightbulbSvg from 'lucide-static/icons/lightbulb.svg?raw';
import triangleAlertSvg from 'lucide-static/icons/triangle-alert.svg?raw';
import shieldAlertSvg from 'lucide-static/icons/shield-alert.svg?raw';
import circleAlertSvg from 'lucide-static/icons/circle-alert.svg?raw';
import messageSquareQuoteSvg from 'lucide-static/icons/message-square-quote.svg?raw';
import circleCheckBigSvg from 'lucide-static/icons/circle-check-big.svg?raw';

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
