import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Globe, Network, Search } from 'lucide-react';
import type { GraphJSON, GraphNodeJSON, GraphLinkJSON } from '../lib/graph-data';

type NodeDatum = GraphNodeJSON & d3.SimulationNodeDatum;

interface GraphBrowserProps {
	graph: GraphJSON;
	/** Highlight (and center context on) this article node. */
	focus?: string;
	isSubGraph?: boolean;
}

const FOCUS_COLOR = '#f59e0b';
const LAYOUT_KEY = 'hakushi:graph-layout';

type GraphLayout = 'flat' | 'sphere';

interface Vec3 {
	x: number;
	y: number;
	z: number;
}

/** Evenly spread n points over the unit sphere (Fibonacci lattice). */
function fibonacciSphere(i: number, n: number): Vec3 {
	const y = 1 - (2 * (i + 0.5)) / n;
	const r = Math.sqrt(Math.max(0, 1 - y * y));
	const theta = Math.PI * (3 - Math.sqrt(5)) * i;
	return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
}

function normalize(v: Vec3): Vec3 {
	const len = Math.hypot(v.x, v.y, v.z) || 1;
	return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/** Spherical linear interpolation between two unit vectors. */
function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
	const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z));
	const omega = Math.acos(dot);
	if (omega < 1e-4) return a;
	const sin = Math.sin(omega);
	const wa = Math.sin((1 - t) * omega) / sin;
	const wb = Math.sin(t * omega) / sin;
	return { x: a.x * wa + b.x * wb, y: a.y * wa + b.y * wb, z: a.z * wa + b.z * wb };
}

function readStoredLayout(): GraphLayout {
	const param = new URLSearchParams(window.location.search).get('layout');
	if (param === 'sphere' || param === 'flat') return param;
	try {
		return window.localStorage.getItem(LAYOUT_KEY) === 'sphere' ? 'sphere' : 'flat';
	} catch {
		return 'flat';
	}
}

function cssVar(name: string, fallback: string): string {
	if (typeof window === 'undefined') return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function TypeToggle({
	label,
	dotColor,
	checked,
	onChange,
}: {
	label: string;
	dotColor: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={checked}
			onClick={() => onChange(!checked)}
			className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
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
	const [layout, setLayoutState] = useState<GraphLayout>('flat');
	// Sphere orientation + zoom, kept across redraws (theme change, filters).
	const sphereViewRef = useRef({ yaw: 0, pitch: -0.35, scale: 1 });

	useEffect(() => {
		if (!isSubGraph) setLayoutState(readStoredLayout());
	}, [isSubGraph]);

	const setLayout = (value: GraphLayout) => {
		setLayoutState(value);
		try {
			window.localStorage.setItem(LAYOUT_KEY, value);
		} catch {
			/* storage unavailable - layout just isn't remembered */
		}
	};
	const sphereMode = layout === 'sphere' && !isSubGraph;
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

		// forceLink mutates endpoint ids into node objects (and the memoised
		// links survive redraws), so always read endpoints through endId.
		const endId = (endpoint: unknown): string =>
			typeof endpoint === 'object' && endpoint !== null
				? ((endpoint as { id: string }).id ?? String(endpoint))
				: String(endpoint);
		const adjacency = new Map<string, Set<string>>();
		for (const link of links) {
			const sId = endId(link.source);
			const tId = endId(link.target);
			if (!adjacency.has(sId)) adjacency.set(sId, new Set());
			if (!adjacency.has(tId)) adjacency.set(tId, new Set());
			adjacency.get(sId)!.add(tId);
			adjacency.get(tId)!.add(sId);
		}

		/**
		 * Spherical layout: nodes live on the surface of a unit sphere. A small
		 * custom force loop (pairwise repulsion + link springs, re-projected onto
		 * the sphere every step) spreads them out, and the globe is drawn with a
		 * mild perspective projection. Drag rotates, wheel / pinch zooms, and it
		 * drifts slowly while idle.
		 */
		function renderSphere() {
			const view = sphereViewRef.current;
			const n = nodes.length;
			const index = new Map(nodes.map((node, i) => [node.id, i]));
			// Seed deterministically, grouping articles near their category so
			// the layout settles quickly into readable clusters.
			const order = [...nodes.keys()].sort((a, b) => {
				const ka = nodes[a].collection ?? nodes[a].type;
				const kb = nodes[b].collection ?? nodes[b].type;
				return ka.localeCompare(kb) || nodes[a].id.localeCompare(nodes[b].id);
			});
			const pos: Vec3[] = new Array(n);
			order.forEach((nodeIdx, i) => {
				pos[nodeIdx] = fibonacciSphere(i, n);
			});
			const edges = links
				.map((link) => ({
					a: index.get(endId(link.source)),
					b: index.get(endId(link.target)),
					type: link.type,
				}))
				.filter((e): e is { a: number; b: number; type: GraphLinkJSON['type'] } =>
					e.a !== undefined && e.b !== undefined
				);

			// Spring rest length (chord) that would tile the sphere evenly.
			const restLength = Math.min(0.9, 2.6 / Math.sqrt(Math.max(n, 1)));
			let alpha = 1;
			const layoutStep = () => {
				const force: Vec3[] = pos.map(() => ({ x: 0, y: 0, z: 0 }));
				const repulse = 0.25 / n;
				for (let i = 0; i < n; i++) {
					for (let j = i + 1; j < n; j++) {
						const dx = pos[i].x - pos[j].x;
						const dy = pos[i].y - pos[j].y;
						const dz = pos[i].z - pos[j].z;
						const d2 = dx * dx + dy * dy + dz * dz + 1e-4;
						const f = repulse / (d2 * Math.sqrt(d2));
						force[i].x += dx * f;
						force[i].y += dy * f;
						force[i].z += dz * f;
						force[j].x -= dx * f;
						force[j].y -= dy * f;
						force[j].z -= dz * f;
					}
				}
				for (const { a, b } of edges) {
					const dx = pos[b].x - pos[a].x;
					const dy = pos[b].y - pos[a].y;
					const dz = pos[b].z - pos[a].z;
					const d = Math.hypot(dx, dy, dz) || 1e-4;
					const f = (0.4 * (d - restLength)) / d;
					force[a].x += dx * f;
					force[a].y += dy * f;
					force[a].z += dz * f;
					force[b].x -= dx * f;
					force[b].y -= dy * f;
					force[b].z -= dz * f;
				}
				const maxStep = 0.08 * alpha;
				for (let i = 0; i < n; i++) {
					const f = force[i];
					const len = Math.hypot(f.x, f.y, f.z);
					const k = len > maxStep ? maxStep / len : 1;
					pos[i] = normalize({
						x: pos[i].x + f.x * k,
						y: pos[i].y + f.y * k,
						z: pos[i].z + f.z * k,
					});
				}
				alpha *= 0.985;
			};
			// Settle most of the layout up front so the globe doesn't open on a
			// scramble; the remainder animates in.
			const budget = Math.max(20, Math.min(200, Math.floor(4e6 / Math.max(n * n, 1))));
			for (let i = 0; i < budget && alpha > 0.05; i++) layoutStep();

			// Leave room for the control bar overlaying the top of the canvas.
			const TOOLBAR = 80;
			const cx = width / 2;
			const cy = TOOLBAR + (height - TOOLBAR) / 2;
			const baseRadius = Math.min(width, height - TOOLBAR) * 0.36;
			const PERSPECTIVE = 3.2;

			const project = (p: Vec3) => {
				const cosY = Math.cos(view.yaw);
				const sinY = Math.sin(view.yaw);
				const cosP = Math.cos(view.pitch);
				const sinP = Math.sin(view.pitch);
				const x1 = p.x * cosY + p.z * sinY;
				const z1 = -p.x * sinY + p.z * cosY;
				const y2 = p.y * cosP - z1 * sinP;
				const z2 = p.y * sinP + z1 * cosP;
				const s = PERSPECTIVE / (PERSPECTIVE - z2);
				const r = baseRadius * view.scale;
				return { x: cx + x1 * r * s, y: cy + y2 * r * s, z: z2, s };
			};

			// Globe backdrop
			const defs = svg.append('defs');
			const gradient = defs
				.append('radialGradient')
				.attr('id', 'graph-globe-fill')
				.attr('cx', '35%')
				.attr('cy', '30%')
				.attr('r', '75%');
			gradient.append('stop').attr('offset', '0%').attr('stop-color', primaryColor).attr('stop-opacity', 0.1);
			gradient.append('stop').attr('offset', '100%').attr('stop-color', primaryColor).attr('stop-opacity', 0.02);

			const globe = svg
				.append('circle')
				.attr('fill', 'url(#graph-globe-fill)')
				.attr('stroke', borderColor)
				.attr('stroke-opacity', 0.6);

			const g = svg.append('g').attr('class', 'graph-container');
			const linkLayer = g.append('g').attr('fill', 'none');
			const nodeLayer = g.append('g');

			const ARC_SEGMENTS = 10;
			const line = d3
				.line<{ x: number; y: number }>()
				.x((p) => p.x)
				.y((p) => p.y)
				.curve(d3.curveCatmullRom);
			const linkElements = linkLayer
				.selectAll<SVGPathElement, (typeof edges)[number]>('path')
				.data(edges)
				.enter()
				.append('path')
				// --border is too faint once depth-faded; use the muted text tone.
				.attr('stroke', cssVar('--text-muted', '#94a3b8'))
				.attr('stroke-width', (d) => (d.type === 'explicit-link' ? 2 : 1))
				.attr('stroke-dasharray', (d) => (d.type === 'tag' ? '3,3' : 'none'));

			const nodeElements = nodeLayer
				.selectAll<SVGGElement, NodeDatum>('g')
				.data(nodes)
				.enter()
				.append('g')
				.attr('cursor', 'pointer');

			nodeElements
				.filter((d) => d.id === focus)
				.append('circle')
				.attr('class', 'pointer-events-none')
				.attr('r', (d) => d.val + 5)
				.attr('fill', 'none')
				.attr('stroke', FOCUS_COLOR)
				.attr('stroke-width', 1.5)
				.attr('stroke-dasharray', '3,3');

			nodeElements
				.append('circle')
				.attr('r', (d) => d.val)
				.attr('fill', (d) => getNodeColor(d))
				.attr('stroke', '#ffffff')
				.attr('stroke-width', 1.5);

			const labels = nodeElements
				.append('text')
				.text((d) => d.name)
				.attr('x', (d) => d.val + 6)
				.attr('y', 4)
				.attr('font-size', '12px')
				.attr('font-weight', (d) => (d.type === 'article' ? '600' : '400'))
				.attr('fill', 'currentColor')
				.attr('class', 'text-[var(--text-main)] pointer-events-none select-none');

			let hoveredId: string | null = null;
			const depthOpacity = (z: number) => 0.18 + 0.82 * ((z + 1) / 2) ** 1.5;

			const draw = () => {
				const r = baseRadius * view.scale;
				globe.attr('cx', cx).attr('cy', cy).attr('r', r * (PERSPECTIVE / Math.sqrt(PERSPECTIVE ** 2 - 1)));
				const projected = pos.map(project);
				const neighborIds = hoveredId ? adjacency.get(hoveredId) : undefined;

				nodeElements
					.attr('transform', (_, i) => {
						const p = projected[i];
						return `translate(${p.x},${p.y}) scale(${0.55 + 0.45 * ((p.z + 1) / 2) * p.s})`;
					})
					.attr('opacity', (d, i) => {
						const base = depthOpacity(projected[i].z);
						if (!hoveredId) return base;
						if (d.id === hoveredId || d.id === focus || neighborIds?.has(d.id)) return Math.max(base, 0.9);
						return base * 0.12;
					});
				labels.attr('opacity', (d, i) => {
					if (hoveredId && (d.id === hoveredId || neighborIds?.has(d.id))) return 1;
					// Only label the near hemisphere to keep the globe legible.
					return projected[i].z > 0.15 ? Math.min(1, (projected[i].z - 0.15) * 2.5) : 0;
				});
				// Paint far nodes first so near ones sit on top.
				nodeElements.sort((a, b) => projected[index.get(a.id)!].z - projected[index.get(b.id)!].z);

				linkElements
					.attr('d', ({ a, b }) => {
						const pts = [];
						for (let k = 0; k <= ARC_SEGMENTS; k++) pts.push(project(slerp(pos[a], pos[b], k / ARC_SEGMENTS)));
						return line(pts);
					})
					.attr('stroke-opacity', ({ a, b }) => {
						const depth = depthOpacity((projected[a].z + projected[b].z) / 2) * 0.4;
						if (!hoveredId) return depth;
						return nodes[a].id === hoveredId || nodes[b].id === hoveredId ? 0.95 : 0.04;
					});
			};

			// Drag = rotate, wheel / pinch = zoom. d3.zoom gives us unified
			// mouse + touch gestures; its translation deltas drive rotation.
			let last = { x: 0, y: 0 };
			let interacting = false;
			let dragMoved = false;
			const zoom = d3
				.zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.4, 4])
				.on('start', (event) => {
					interacting = true;
					dragMoved = false;
					last = { x: event.transform.x, y: event.transform.y };
				})
				.on('zoom', (event) => {
					const t = event.transform;
					const dx = t.x - last.x;
					const dy = t.y - last.y;
					last = { x: t.x, y: t.y };
					if (event.sourceEvent?.type !== 'wheel' && Math.hypot(dx, dy) > 0) {
						dragMoved = true;
						const speed = 1 / (baseRadius * view.scale);
						view.yaw += dx * speed;
						view.pitch = Math.max(-1.5, Math.min(1.5, view.pitch - dy * speed));
					}
					view.scale = t.k;
					draw();
				})
				.on('end', () => {
					interacting = false;
				});
			svg.call(zoom as never);
			svg.call(zoom.transform as never, d3.zoomIdentity.scale(view.scale));

			nodeElements
				.on('mouseenter', (_, d) => {
					hoveredId = d.id;
					setHoveredNode(d);
					draw();
				})
				.on('mouseleave', () => {
					hoveredId = null;
					setHoveredNode(null);
					draw();
				})
				.on('click', (_, d) => {
					if (dragMoved) {
						dragMoved = false;
						return;
					}
					if (d.url) window.location.assign(d.url);
				});

			const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
			let lastTime = 0;
			const timer = d3.timer((elapsed) => {
				const dt = Math.min(64, elapsed - lastTime);
				lastTime = elapsed;
				let changed = false;
				if (alpha > 0.02) {
					layoutStep();
					changed = true;
				}
				if (!reduceMotion && !interacting && !hoveredId) {
					view.yaw += dt * 0.00012;
					changed = true;
				}
				if (changed) draw();
			});
			draw();

			return () => timer.stop();
		}

		if (sphereMode) {
			return renderSphere();
		}

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

		const degree = new Map<string, number>();
		for (const [id, set] of adjacency) degree.set(id, set.size);

		// Force Simulation
		const simulation = d3
			.forceSimulation<NodeDatum>(nodes)
			.force(
				'link',
				d3
					.forceLink<NodeDatum, GraphLinkJSON & d3.SimulationLinkDatum<NodeDatum>>(links)
					.id((d) => d.id)
					.distance((d) => {
						if (isSubGraph) return 45;
						return d.type === 'category' ? 55 : d.type === 'tag' ? 45 : 80;
					})
					// Category links are firm springs so each category's articles
					// gather into a cluster. Other links use d3's degree-based
					// default: a tag used once hugs its article, while a tag shared
					// across many articles pulls weakly and doesn't glue every
					// cluster into one blob.
					.strength((d) => {
						if (isSubGraph) return 0.7;
						if (d.type === 'category') return 0.8;
						const deg = Math.min(
							degree.get(endId(d.source)) ?? 1,
							degree.get(endId(d.target)) ?? 1
						);
						return (d.type === 'tag' ? 1 : 0.4) / deg;
					})
			)
			// Tags barely repel so they sit snugly around their article; the cap
			// stops disconnected pieces being flung to the far edges.
			.force(
				'charge',
				d3
					.forceManyBody<NodeDatum>()
					.strength((d) => {
						if (isSubGraph) return -120;
						return d.type === 'category' ? -300 : d.type === 'tag' ? -50 : -200;
					})
					.distanceMax(isSubGraph ? 400 : 500)
			)
			.force('center', d3.forceCenter(width / 2, height / 2))
			// Light gravity keeps the clusters on screen without crushing them.
			.force('x', d3.forceX(width / 2).strength(0.02))
			.force('y', d3.forceY(height / 2).strength(0.02))
			.force('collision', d3.forceCollide<NodeDatum>().radius((d) => d.val + 8));

		// Most categories hold only one or two articles, so the visible groups
		// are collections: pull each collection's articles toward their shared
		// centroid. Categories and tags follow along via their links.
		if (!isSubGraph) {
			const clusterForce = (alpha: number) => {
				const centroids = new Map<string, { x: number; y: number; k: number }>();
				for (const node of nodes) {
					if (node.type !== 'article' || !node.collection) continue;
					const c = centroids.get(node.collection) ?? { x: 0, y: 0, k: 0 };
					c.x += node.x ?? 0;
					c.y += node.y ?? 0;
					c.k += 1;
					centroids.set(node.collection, c);
				}
				for (const node of nodes) {
					if (node.type !== 'article' || !node.collection) continue;
					const c = centroids.get(node.collection)!;
					if (c.k < 2) continue;
					node.vx = (node.vx ?? 0) + (c.x / c.k - (node.x ?? 0)) * 0.4 * alpha;
					node.vy = (node.vy ?? 0) + (c.y / c.k - (node.y ?? 0)) * 0.4 * alpha;
				}
			};
			simulation.force('cluster', clusterForce as d3.Force<NodeDatum, undefined>);
		}

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

		// Labels - the compact article subgraph only reveals them on hover so
		// overlapping names don't clutter the sidebar.
		const labels = nodeElements
			.append('text')
			.text((d) => d.name)
			.attr('x', (d) => d.val + 6)
			.attr('y', 4)
			.attr('font-size', isSubGraph ? '10px' : '12px')
			.attr('font-weight', (d) => (d.type === 'article' ? '600' : '400'))
			.attr('fill', 'currentColor')
			.attr('class', 'text-[var(--text-main)] pointer-events-none select-none')
			.attr('opacity', isSubGraph ? 0 : 1);

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
			if (isSubGraph) {
				labels.attr('opacity', (d) =>
					hoveredId && (d.id === hoveredId || neighborIds?.has(d.id)) ? 1 : 0
				);
			}
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
	}, [nodes, links, focus, isSubGraph, themeTick, sphereMode]);

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

						<div
							role="group"
							aria-label="Graph layout"
							className="flex items-center gap-1 bg-[var(--bg-sidebar)]/60 p-1 rounded-md"
						>
							{(
								[
									['flat', 'Flat', Network],
									['sphere', 'Sphere', Globe],
								] as const
							).map(([value, label, Icon]) => (
								<button
									key={value}
									type="button"
									aria-pressed={layout === value}
									onClick={() => setLayout(value)}
									className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
										layout === value
											? 'bg-[var(--bg-surface)] text-[var(--text-main)]'
											: 'text-[var(--text-muted)] opacity-60 hover:opacity-100'
									}`}
								>
									<Icon className="w-3.5 h-3.5" />
									{label}
								</button>
							))}
						</div>

						<div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
							<span>{nodes.length} Nodes</span>
							<span>•</span>
							<span>{links.length} Edges</span>
						</div>
					</div>
				</div>
			)}

			{/* SVG Canvas - touch-none lets d3-zoom own pinch/pan gestures */}
			<svg
				ref={svgRef}
				className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
			/>

			{nodes.length === 0 && (
				<div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-xs pointer-events-none">
					No nodes match the current filters.
				</div>
			)}

			{/* Hover Info Tooltip */}
			{hoveredNode && !isSubGraph && (
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
