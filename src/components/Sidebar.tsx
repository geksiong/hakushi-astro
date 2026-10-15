import { useEffect, useState } from 'react';
import {
	PanelLeftClose,
	PanelLeftOpen,
	BookOpen,
	Calendar,
	Microscope,
	FileText,
	Share2,
	Network,
	Folder,
	Layers,
	Info,
	Link as LinkIcon,
	Globe,
	Mail,
	GitFork,
	ExternalLink,
	Home,
	Rss,
	MessageCircle,
} from 'lucide-react';
import SidebarContent from './SidebarContent';
import type { ArticleMeta } from '../lib/articles';
import type { CollectionConfig } from '../lib/collections';
import type { SidebarLink } from '../lib/sidebar';

interface SidebarProps {
	collections: CollectionConfig[];
	articles: ArticleMeta[];
	currentSlug: string;
	selectedCollectionId?: string;
	/** Set by ReaderShell on /graph so SSR already shows no collection selected. */
	isGraphPage?: boolean;
	/** Set by ReaderShell on /about so SSR already shows no collection selected. */
	isAboutPage?: boolean;
	/** Configurable pages/sites listed below the collections. */
	links?: SidebarLink[];
}

const COLLAPSED_ICONS: Record<string, any> = {
	BookOpen,
	Calendar,
	Microscope,
	FileText,
	Share2,
	Folder,
	Layers,
	Info,
	Link: LinkIcon,
	Globe,
	Mail,
	GitFork,
	// lucide dropped brand icons - 'Github' maps to a git stand-in.
	Github: GitFork,
	ExternalLink,
	Home,
	Rss,
	MessageCircle,
	Network,
};

/**
 * Resolve which collection is active for highlighting the collapsed rail.
 * Prefers the explicit prop (set by ReaderShell per page), then the URL,
 * then the last selection stored by the expanded sidebar.
 */
function getActiveCollectionId(
	selectedCollectionId: string | undefined,
	collections: CollectionConfig[]
): string {
	if (selectedCollectionId) return selectedCollectionId;
	if (typeof window !== 'undefined') {
		const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
		if (path === '') return 'all';
		const firstSegment = path.split('/')[0];
		if (collections.some((c) => c.id === firstSegment)) {
			return firstSegment;
		}
	}
	try {
		return localStorage.getItem('hakushi_collection') || 'all';
	} catch {
		return 'all';
	}
}

/**
 * Desktop inline navigation column (lg+ only). On smaller screens the page
 * uses the MobileNav drawer mounted globally in BaseLayout.
 *
 * Collapsible: click the toggle to shrink to a narrow strip or expand back.
 * State is persisted to localStorage. When collapsed, an icon rail with
 * quick links to All Collections + every collection stays visible.
 */
export default function Sidebar({
	collections,
	articles,
	currentSlug,
	selectedCollectionId,
	isGraphPage: graphPageProp = false,
	isAboutPage: aboutPageProp = false,
	links = [],
}: SidebarProps) {
	const [collapsed, setCollapsed] = useState<boolean>(() => {
		try {
			// The head init script already applied the stored state to <html>
			// before paint - read it first so hydration renders the same state.
			if (
				typeof document !== 'undefined' &&
				document.documentElement.classList.contains('hakushi-sidebar-collapsed')
			) {
				return true;
			}
			return localStorage.getItem('hakushi_sidebar_collapsed') === 'true';
		} catch {
			return false;
		}
	});

	// Keep the pre-paint <html> class in sync (toggle, mount, other tabs).
	useEffect(() => {
		try {
			document.documentElement.classList.toggle('hakushi-sidebar-collapsed', collapsed);
		} catch {
			/* ignore */
		}
	}, [collapsed]);

	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key === 'hakushi_sidebar_collapsed') {
				setCollapsed(e.newValue === 'true');
			}
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);

	const toggle = () => {
		setCollapsed((prev) => {
			const next = !prev;
			try {
				localStorage.setItem('hakushi_sidebar_collapsed', String(next));
			} catch {
				/* ignore */
			}
			return next;
		});
	};

	const activeCollectionId = getActiveCollectionId(selectedCollectionId, collections);
	// Server-known first (via ReaderShell on /graph, so SSR shows the final
	// state with no flash); the URL check covers uses without the prop.
	const [isGraphPage, setIsGraphPage] = useState<boolean>(graphPageProp);
	useEffect(() => {
		if (!graphPageProp) {
			setIsGraphPage(window.location.pathname.replace(/\/+$/, '') === '/graph');
		}
	}, [graphPageProp]);

	// Same treatment for /about: server-known first, URL check otherwise.
	// Any non-collection, non-graph internal sidebar link also deselects
	// the collections once the client path is known.
	const normalizePath = (p: string) => p.replace(/\/+$/, '') || '/';
	const [currentPath, setCurrentPath] = useState<string>(aboutPageProp ? '/about' : '');
	useEffect(() => {
		setCurrentPath(normalizePath(window.location.pathname));
	}, []);
	const isAboutPage = aboutPageProp || currentPath === '/about';
	const noCollectionSelected =
		isGraphPage ||
		isAboutPage ||
		links.some((l) => !l.external && normalizePath(l.href) === currentPath);
	const isLinkActive = (href: string, external?: boolean) =>
		!external && currentPath !== '' && normalizePath(href) === currentPath;

	return (
		<aside
			data-sidebar
			className={`shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto hidden lg:flex flex-col text-xs transition-all duration-300 ${
				collapsed ? 'w-10' : 'w-72'
			}`}
		>
			{/* Toggle button */}
			<div
				data-sidebar-toggle
				className={`flex items-center ${collapsed ? 'justify-center' : 'justify-end'} p-1.5 border-b border-[var(--border)]`}
			>
				<button
					onClick={toggle}
					title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
				>
					{/* Both icons always rendered - visibility toggles via classes so
					    hydration only patches attributes instead of remounting. */}
					<PanelLeftOpen
						data-sidebar-icon="open"
						className={`w-4 h-4 ${collapsed ? '' : 'hidden'}`}
					/>
					<PanelLeftClose
						data-sidebar-icon="close"
						className={`w-4 h-4 ${collapsed ? 'hidden' : ''}`}
					/>
				</button>
			</div>

			{/* Collapsed icon rail: quick navigation to collections. Always
			    rendered (hidden when expanded) so hydration never remounts. */}
			<nav
				data-sidebar-rail
				aria-label="Collections"
				className={`flex-1 flex-col items-center gap-1 py-2 px-1.5 ${collapsed ? 'flex' : 'hidden'}`}
			>
					<a
						href="/"
						title="All Collections"
						aria-label="All Collections"
						aria-current={activeCollectionId === 'all' && !noCollectionSelected ? 'page' : undefined}
						className={`p-2 rounded-lg transition-all ${
							activeCollectionId === 'all' && !noCollectionSelected
								? 'bg-[var(--primary)] text-white shadow-xs'
								: 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)]'
						}`}
					>
						<Layers className="w-4 h-4" />
					</a>

					<div aria-hidden="true" className="w-5 border-t border-[var(--border)] my-1" />

					{collections.map((col) => {
						const IconComponent = COLLAPSED_ICONS[col.iconName ?? 'Folder'] || Folder;
						const isActive = activeCollectionId === col.id && !noCollectionSelected;
						return (
							<a
								key={col.id}
								href={`/${col.id}`}
								title={col.description ? `${col.name} — ${col.description}` : col.name}
								aria-label={col.name}
								aria-current={isActive ? 'page' : undefined}
								className={`p-2 rounded-lg transition-all ${
									isActive
										? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30'
										: 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)]'
								}`}
							>
							<IconComponent className="w-4 h-4" />
						</a>
					);
				})}

				<div aria-hidden="true" className="w-5 border-t border-[var(--border)] my-1" />

				<a
					href="/graph"
					title="Knowledge Graph"
					aria-label="Knowledge Graph"
					aria-current={isGraphPage ? 'page' : undefined}
					className={`p-2 rounded-lg transition-all ${
						isGraphPage
							? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30'
							: 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)]'
					}`}
				>
					<Network className="w-4 h-4" />
				</a>

				{links.length > 0 && (
					<>
						<div aria-hidden="true" className="w-5 border-t border-[var(--border)] my-1" />

						{links.map((link) => {
							const IconComponent = COLLAPSED_ICONS[link.iconName ?? 'Link'] || LinkIcon;
							const isActive = isLinkActive(link.href, link.external);
							return (
								<a
									key={link.href}
									href={link.href}
									title={link.description || link.label}
									aria-label={link.label}
									aria-current={isActive ? 'page' : undefined}
									target={link.external ? '_blank' : undefined}
									rel={link.external ? 'noopener noreferrer' : undefined}
									className={`p-2 rounded-lg transition-all ${
										isActive
											? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30'
											: 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)]'
									}`}
								>
									<IconComponent className="w-4 h-4" />
								</a>
							);
						})}
					</>
				)}
			</nav>

			{/* Expanded content - always rendered (hidden when collapsed) so
			    hydration only patches classes instead of remounting. */}
			<div
				data-sidebar-expanded
				className={`flex-1 flex-col justify-between overflow-y-auto ${collapsed ? 'hidden' : 'flex'}`}
			>
			<SidebarContent
				collections={collections}
				articles={articles}
				currentSlug={currentSlug}
				selectedCollectionId={selectedCollectionId}
				isGraphPage={isGraphPage}
				isAboutPage={isAboutPage}
				links={links}
			/>
			</div>
		</aside>
	);
}
