import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Search } from 'lucide-react';
import type { GraphJSON, GraphNodeJSON, GraphLinkJSON } from '../lib/graph-data';

type NodeDatum = GraphNodeJSON & d3.SimulationNodeDatum;

interface GraphBrowserProps {
	graph: GraphJSON;
	/** Highlight (and center context on) this article node. */
	focus?: string;
	isSubGraph?: boolean;
}

const FOCUS_COLOR = '#f59e0b';

function cssVar(name: string, fallback: string): string {
	if (typeof window === 'undefined') return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function TypeToggle({
	label,
	dotColor,
	checked,
	onChange,
	compact = false,
}: {
	label: string;
	dotColor: string;
	checked: boolean;
	onChange: (value: boolean) => void;
	compact?: boolean;
}) {
	return (
		<button
			type="button"
			aria-pressed={checked}
			onClick={() => onChange(!checked)}
			className={`flex items-center rounded-md font-medium capitalize transition-colors ${
				compact ? 'gap-1 px-1.5 py-0.5 text-[10px]' : 'gap-1.5 px-2.5 py-1 text-xs'
			} ${
				checked
					? 'bg-[var(--bg-surface)] text-[var(--text-main)]'
					: 'text-[var(--text-muted)] opacity-50 hover:opacity-90'
			}`}
		>
			<span
				className="w-2 h-2 rounded-full shrink-0"
				style={{ backgroundColor: dotColor, opacity: checked ? 1 : 0.5 }}
			/>
			{label}
		</button>
	);
}

/**
 * Ported from the reference project's GraphBrowser.tsx. The graph itself is
 * generated at build time from every article collection (articles, their
 * categories, their tags and explicit [[wikilinks]]).
 */
export default function GraphBrowser({ graph, focus, isSubGraph = false }: GraphBrowserProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);

	const [showCategories, setShowCategories] = useState(true);
	const [showTags, setShowTags] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [hoveredNode, setHoveredNode] = useState<GraphNodeJSON | null>(null);
	const [themeTick, setThemeTick] = useState(0);
	// Last pan/zoom viewport, reapplied when the graph is redrawn (theme change)
	// so the reader doesn't lose their place.
	const viewTransformRef = useRef<d3.ZoomTransform | null>(null);

	// Re-render colors when the appearance scheme changes: applyTheme() writes
	// CSS custom properties + the dark class onto <html>, which we observe here
	// and turn into a D3 redraw (the SVG fills are sampled at draw time).
	useEffect(() => {
		const observer = new MutationObserver(() => setThemeTick((v) => v + 1));
		observer.observe(document.documentElement, {
			attributeFilter: ['style', 'class'],
		});
		return () => observer.disconnect();
	}, []);

	// Construct Nodes and Links
	const { nodes, links } = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();

		const nodeList: NodeDatum[] = [];
		const linkList: (GraphLinkJSON & d3.SimulationLinkDatum<NodeDatum>)[] = [];

		for (const raw of graph.nodes) {
			if (raw.type === 'category' && !showCategories) continue;
			if (raw.type === 'tag' && !showTags) continue;
			if (q && !raw.name.toLowerCase().includes(q) && !raw.id.toLowerCase().includes(q)) {
				continue;
			}
			nodeList.push({ ...raw });
		}

		const ids = new Set(nodeList.map((n) => n.id));
		for (const link of graph.links) {
			if (ids.has(String(link.source)) && ids.has(String(link.target))) {
				linkList.push({ ...link });
			}
		}

		return { nodes: nodeList, links: linkList };
	}, [graph, showCategories, showTags, searchQuery]);

	// Highlight connections map
	const neighborsMap = useMemo(() => {
		const map = new Map<string, Set<string>>();
		links.forEach((link) => {
			const sId = String(link.source);
			const tId = String(link.target);
			if (!map.has(sId)) map.set(sId, new Set());
			if (!map.has(tId)) map.set(tId, new Set());
			map.get(sId)!.add(tId);
			map.get(tId)!.add(sId);
		});
		return map;
	}, [links]);

	// D3 Render & Simulation
	useEffect(() => {
		if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

		const width = containerRef.current.clientWidth || 800;
		const height = containerRef.current.clientHeight || (isSubGraph ? 260 : 600);

		const svg = d3.select(svgRef.current);
		svg.selectAll('*').remove();

		const g = svg.append('g').attr('class', 'graph-container');

		// Zoom behavior
		const zoom = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.2, 4])
			.on('zoom', (event) => {
				viewTransformRef.current = event.transform;
				g.attr('transform', event.transform);
			});

		svg.call(zoom as never);

		// Restore the previous viewport after a theme-triggered redraw.
		if (viewTransformRef.current) {
			svg.call(zoom.transform as never, viewTransformRef.current);
		}

		// Color helpers
		const primaryColor = cssVar('--primary', '#6366f1');
		const accentColor = cssVar('--accent', '#06b6d4');
		const secondaryColor = cssVar('--secondary', '#a855f7');
		const borderColor = cssVar('--border', '#334155');

		const getNodeColor = (node: NodeDatum) => {
			if (node.id === focus) return FOCUS_COLOR;
			if (node.type === 'article') return primaryColor;
			if (node.type === 'category') return accentColor;
			if (node.type === 'tag') return secondaryColor;
			return '#94a3b8';
		};

		// forceLink mutates endpoint ids into node objects, so capture the plain
		// id adjacency before starting the simulation.
		const adjacency = new Map<string, Set<string>>();
		for (const link of links) {
			const sId = String(link.source);
			const tId = String(link.target);
			if (!adjacency.has(sId)) adjacency.set(sId, new Set());
			if (!adjacency.has(tId)) adjacency.set(tId, new Set());
			adjacency.get(sId)!.add(tId);
			adjacency.get(tId)!.add(sId);
		}
		const endId = (endpoint: unknown): string =>
			typeof endpoint === 'object' && endpoint !== null
				? ((endpoint as { id: string }).id ?? String(endpoint))
				: String(endpoint);

		// Force Simulation
		const simulation = d3
			.forceSimulation<NodeDatum>(nodes)
			.force(
				'link',
				d3
					.forceLink<NodeDatum, GraphLinkJSON & d3.SimulationLinkDatum<NodeDatum>>(links)
					.id((d) => d.id)
					.distance(isSubGraph ? 45 : 70)
			)
			.force('charge', d3.forceManyBody().strength(isSubGraph ? -120 : -220))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.force('collision', d3.forceCollide<NodeDatum>().radius((d) => d.val + 10));

		// Links render
		const linkElements = g
			.append('g')
			.selectAll<SVGLineElement, GraphLinkJSON & d3.SimulationLinkDatum<NodeDatum>>('line')
			.data(links)
			.enter()
			.append('line')
			.attr('stroke', borderColor)
			.attr('stroke-opacity', 0.5)
			.attr('stroke-width', (d: GraphLinkJSON) => (d.type === 'explicit-link' ? 2 : 1))
			.attr('stroke-dasharray', (d: GraphLinkJSON) => (d.type === 'tag' ? '3,3' : 'none'))
			.style('transition', 'stroke-opacity 150ms ease');

		// Nodes render
		let dragMoved = false;
		let dragStartX = 0;
		let dragStartY = 0;

		const nodeElements = g
			.append('g')
			.selectAll('g')
			.data(nodes)
			.enter()
			.append('g')
			.attr('cursor', 'pointer')
			.call(
				d3
					.drag<SVGGElement, NodeDatum>()
					.on('start', (event, d) => {
						if (!event.active) simulation.alphaTarget(0.3).restart();
						d.fx = d.x;
						d.fy = d.y;
						dragMoved = false;
						const source = event.sourceEvent as PointerEvent | undefined;
						dragStartX = source?.clientX ?? 0;
						dragStartY = source?.clientY ?? 0;
					})
					.on('drag', (event, d) => {
						const source = event.sourceEvent as PointerEvent | undefined;
						if (
							source &&
							Math.hypot(source.clientX - dragStartX, source.clientY - dragStartY) > 5
						) {
							dragMoved = true;
						}
						d.fx = event.x;
						d.fy = event.y;
					})
					.on('end', (event, d) => {
						if (!event.active) simulation.alphaTarget(0);
						d.fx = null;
						d.fy = null;
					}) as never
			);

		// Current-article halo ring (sits under the node circle)
		const focusRings = nodeElements
			.filter((d) => d.id === focus)
			.append('circle')
			.attr('class', 'pointer-events-none')
			.attr('r', (d) => d.val + 5)
			.attr('fill', 'none')
			.attr('stroke', FOCUS_COLOR)
			.attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '3,3')
			.attr('opacity', 0.9);

		focusRings
			.append('animate')
			.attr('attributeName', 'r')
			.attr('values', (d) => `${d.val + 5};${d.val + 8};${d.val + 5}`)
			.attr('dur', '2.4s')
			.attr('repeatCount', 'indefinite');

		// Node Circles
		nodeElements
			.append('circle')
			.attr('r', (d) => d.val)
			.attr('fill', (d) => getNodeColor(d))
			.attr('stroke', '#ffffff')
			.attr('stroke-width', 1.5);

		// Labels
		nodeElements
			.append('text')
			.text((d) => d.name)
			.attr('x', (d) => d.val + 6)
			.attr('y', 4)
			.attr('font-size', isSubGraph ? '10px' : '12px')
			.attr('font-weight', (d) => (d.type === 'article' ? '600' : '400'))
			.attr('fill', 'currentColor')
			.attr('class', 'text-[var(--text-main)] pointer-events-none select-none');

		// Hover highlighting: light up the hovered node, its direct neighbours and
		// the connecting edges while fading everything else. The focused article
		// always stays lit so the reader keeps their bearings.
		const applyHover = (hoveredId: string | null) => {
			const neighborIds = hoveredId ? adjacency.get(hoveredId) : undefined;
			nodeElements.attr('opacity', (d) => {
				if (!hoveredId) return 1;
				if (d.id === hoveredId || d.id === focus || neighborIds?.has(d.id)) return 1;
				return 0.12;
			});
			linkElements.attr('stroke-opacity', (d) => {
				if (!hoveredId) return 0.5;
				const sId = endId((d as unknown as { source: unknown }).source);
				const tId = endId((d as unknown as { target: unknown }).target);
				return sId === hoveredId || tId === hoveredId ? 0.95 : 0.05;
			});
		};

		// Event Listeners
		nodeElements
			.on('mouseenter', (_, d) => {
				setHoveredNode(d);
				applyHover(d.id);
			})
			.on('mouseleave', () => {
				setHoveredNode(null);
				applyHover(null);
			})
			.on('click', (_, d) => {
				if (dragMoved) {
					dragMoved = false;
					return;
				}
				if (d.url) window.location.assign(d.url);
			});

		// Simulation Ticks
		simulation.on('tick', () => {
			linkElements
				.attr('x1', (d) => (d.source as NodeDatum).x ?? 0)
				.attr('y1', (d) => (d.source as NodeDatum).y ?? 0)
				.attr('x2', (d) => (d.target as NodeDatum).x ?? 0)
				.attr('y2', (d) => (d.target as NodeDatum).y ?? 0);

			nodeElements.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
		});

		return () => {
			simulation.stop();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [nodes, links, focus, isSubGraph, themeTick]);

	return (
		<div
			ref={containerRef}
			className={`relative w-full text-[var(--text-main)] ${
				isSubGraph ? 'h-64 rounded-lg' : 'h-[calc(100vh-8rem)] rounded-lg'
			} border border-[var(--border)] overflow-hidden`}
		>
			{/* Control Overlay Bar */}
			{!isSubGraph && (
				<div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 rounded-lg bg-[var(--bg-surface)]/85 backdrop-blur-md border border-[var(--border)] text-xs">
					<div className="flex items-center gap-2 flex-1 min-w-[220px]">
						<Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
						<input
							type="text"
							placeholder="Search graph nodes..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full px-2 py-1 rounded-md bg-[var(--bg-sidebar)] border border-[var(--border)] text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-xs"
						/>
					</div>

					{/* Stacked as one row of its own below sm, inline via contents at sm+ */}
					<div className="flex items-center justify-between gap-2 sm:contents">
						{/* Show / Hide Node Types */}
						<div className="flex items-center gap-1 bg-[var(--bg-sidebar)]/60 p-1 rounded-md">
							<TypeToggle
								label="categories"
								dotColor="var(--accent)"
								checked={showCategories}
								onChange={setShowCategories}
							/>
							<TypeToggle
								label="tags"
								dotColor="var(--secondary)"
								checked={showTags}
								onChange={setShowTags}
							/>
						</div>

						<div className="flex items-center gap-2 font-mono text-[var(--text-muted)] text-xs">
							<span>{nodes.length} Nodes</span>
							<span>•</span>
							<span>{links.length} Edges</span>
						</div>
					</div>
				</div>
			)}

			{/* Compact Toggles for the Article Subgraph */}
			{isSubGraph && (
				<div className="absolute top-2 right-2 z-10 flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)]/85 backdrop-blur-md border border-[var(--border)]">
					<TypeToggle
						compact
						label="cats"
						dotColor="var(--accent)"
						checked={showCategories}
						onChange={setShowCategories}
					/>
					<TypeToggle
						compact
						label="tags"
						dotColor="var(--secondary)"
						checked={showTags}
						onChange={setShowTags}
					/>
				</div>
			)}

			{/* SVG Canvas - touch-none lets d3-zoom own pinch/pan gestures */}
			<svg
				ref={svgRef}
				className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
			/>

			{nodes.length === 0 && (
				<div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] font-mono text-xs pointer-events-none">
					No nodes match the current filters.
				</div>
			)}

			{/* Hover Info Tooltip */}
			{hoveredNode && (
				<div className="absolute bottom-4 left-4 z-10 p-3 rounded-lg bg-[var(--bg-surface)]/95 border border-[var(--border)] backdrop-blur-md text-xs pointer-events-none space-y-1 animate-in fade-in">
					<p className="font-semibold text-[var(--text-main)] flex items-center gap-1.5">
						<span
							className="w-2.5 h-2.5 rounded-full"
							style={{
								backgroundColor:
									hoveredNode.type === 'article'
										? 'var(--primary)'
										: hoveredNode.type === 'category'
											? 'var(--accent)'
											: 'var(--secondary)',
							}}
						/>
						{hoveredNode.name}
					</p>
					<p className="text-[var(--text-muted)] capitalize">Type: {hoveredNode.type}</p>
					{hoveredNode.collection && (
						<p className="text-[var(--text-muted)]">Collection: {hoveredNode.collection}</p>
					)}
					<p className="text-[var(--text-muted)]">
						{neighborsMap.get(hoveredNode.id)?.size ?? 0} direct{' '}
						{(neighborsMap.get(hoveredNode.id)?.size ?? 0) === 1 ? 'connection' : 'connections'}
					</p>
					{hoveredNode.id === focus && (
						<p className="font-semibold" style={{ color: FOCUS_COLOR }}>
							Current article
						</p>
					)}
				</div>
			)}
		</div>
	);
}
