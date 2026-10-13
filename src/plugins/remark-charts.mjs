import { loadIcon } from './load-icon.mjs';
const chartSvg = loadIcon('chart-column-big');

const CHART_ICON = chartSvg
	.replace('width="24"', 'width="16"')
	.replace('height="24"', 'height="16"')
	.replace('<svg', '<svg class="chart-header-icon"');

/**
 * remark-charts
 * Runs before shiki, so ```chart fences still carry their language tag.
 * Converts them into static figure markup with the JSON payload embedded in
 * `data-chart`; hydrated client-side by src/scripts/charts.tsx (recharts).
 *
 * @returns {import('unified').Plugin}
 */
export default function remarkCharts() {
	return (tree) => {
		const visit = (node) => {
			if (!node.children) return;
			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				if (child.type === 'code' && (child.lang ?? '').toLowerCase() === 'chart') {
					node.children[i] = buildChartFigure(child.value);
					continue;
				}
				visit(child);
			}
		};
		visit(tree);
	};
}

function safeJson(raw) {
	try {
		return JSON.parse(raw.trim());
	} catch {
		return null;
	}
}

function buildChartFigure(rawJson) {
	const config = safeJson(rawJson);

	const title =
		config && typeof config.title === 'string'
			? config.title
			: config?.type
				? `${String(config.type).toUpperCase()} Chart`
				: 'Chart';

	return {
		type: 'chartBlock',
		data: {
			hName: 'figure',
			hProperties: { className: ['chart-block'] },
			hChildren: [
				{
					type: 'element',
					tagName: 'figcaption',
					properties: { className: ['chart-header'] },
					children: [
						{ type: 'raw', value: CHART_ICON },
						{
							type: 'element',
							tagName: 'span',
							properties: { className: ['chart-header-title'] },
							children: [{ type: 'text', value: title }],
						},
						config?.type
							? {
									type: 'element',
									tagName: 'span',
									properties: { className: ['chart-header-type'] },
									children: [{ type: 'text', value: String(config.type) }],
								}
							: { type: 'text', value: '' },
					],
				},
				{
					type: 'element',
					tagName: 'div',
					properties: {
						className: ['chart-body'],
						dataChart: config ? JSON.stringify(config) : '',
					},
					children:
						config === null
							? [
									{
										type: 'element',
										tagName: 'p',
										properties: { className: ['chart-invalid'] },
										children: [{ type: 'text', value: 'Invalid Chart JSON configuration.' }],
									},
								]
							: [],
				},
			],
		},
	};
}
