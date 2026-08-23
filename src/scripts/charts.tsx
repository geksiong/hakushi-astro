import { createRoot } from 'react-dom/client';
import type { CSSProperties } from 'react';
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	LineChart,
	Line,
	AreaChart,
	Area,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	CartesianGrid,
} from 'recharts';

interface ChartConfig {
	type?: 'bar' | 'line' | 'area' | 'pie';
	title?: string;
	data: Record<string, unknown>[];
	xKey?: string;
	series?: { key: string; name?: string; color?: string }[];
}

const DEFAULT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

function cssVar(name: string, fallback: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function tooltipStyle(): CSSProperties {
	return {
		backgroundColor: cssVar('--bg-surface', '#fff'),
		borderColor: cssVar('--border', '#ccc'),
		color: cssVar('--text-main', '#333'),
		borderRadius: '0.5rem',
		fontSize: '0.75rem',
	};
}

function Chart({ config }: { config: ChartConfig }) {
	const { type = 'bar', data, xKey = 'name', series = [] } = config;

	if (type === 'pie') {
		return (
			<PieChart>
				<Pie data={data} dataKey="value" nameKey={xKey} cx="50%" cy="50%" outerRadius={80} label>
					{data.map((_, index) => (
						<Cell key={index} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
					))}
				</Pie>
				<Tooltip contentStyle={tooltipStyle()} />
				<Legend />
			</PieChart>
		);
	}

	const grid = <CartesianGrid strokeDasharray="3 3" opacity={0.2} />;
	const axes = [
		<XAxis key="x" dataKey={xKey} stroke="currentColor" opacity={0.7} />,
		<YAxis key="y" stroke="currentColor" opacity={0.7} />,
	];
	const tooltipLegend = [<Tooltip key="tip" contentStyle={tooltipStyle()} />, <Legend key="legend" />];

	if (type === 'line') {
		return (
			<LineChart data={data}>
				{grid}
				{axes}
				{tooltipLegend}
				{series.map((entry, index) => (
					<Line
						key={entry.key}
						type="monotone"
						dataKey={entry.key}
						name={entry.name ?? entry.key}
						stroke={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
						strokeWidth={2}
						dot={{ r: 4 }}
					/>
				))}
			</LineChart>
		);
	}

	if (type === 'area') {
		return (
			<AreaChart data={data}>
				{grid}
				{axes}
				{tooltipLegend}
				{series.map((entry, index) => (
					<Area
						key={entry.key}
						type="monotone"
						dataKey={entry.key}
						name={entry.name ?? entry.key}
						stroke={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
						fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
						fillOpacity={0.25}
					/>
				))}
			</AreaChart>
		);
	}

	return (
		<BarChart data={data}>
			{grid}
			{axes}
			{tooltipLegend}
			{series.map((entry, index) => (
				<Bar
					key={entry.key}
					dataKey={entry.key}
					name={entry.name ?? entry.key}
					fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
					radius={[4, 4, 0, 0]}
				/>
			))}
		</BarChart>
	);
}

/** Mount a recharts visualization into `target`. */
function renderChart(target: HTMLElement, config: ChartConfig): void {
	createRoot(target).render(
		<ResponsiveContainer width="100%" height="100%">
			<Chart config={config} />
		</ResponsiveContainer>
	);
}

// Hydrate all ```chart placeholders rendered by rehype-enhancer.
function mountCharts() {
	document.querySelectorAll<HTMLElement>('.chart-body[data-chart]').forEach((el) => {
		if (el.dataset.mounted === 'true') return;
		el.dataset.mounted = 'true';
		try {
			renderChart(el, JSON.parse(el.dataset.chart!) as ChartConfig);
		} catch (err) {
			console.error('Failed to parse chart JSON:', err);
		}
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', mountCharts);
} else {
	mountCharts();
}
