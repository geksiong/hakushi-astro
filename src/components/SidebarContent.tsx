import { useEffect, useState } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import type { ArticleMeta } from '../lib/articles';
import type { CollectionConfig } from '../lib/collections';
import type { SidebarLink } from '../lib/sidebar';

interface SidebarContentProps {
	collections: CollectionConfig[];
	articles: ArticleMeta[];
	currentSlug: string;
	selectedCollectionId?: string;
	/** Called after navigation links are clicked - closes the mobile drawer. */
	onNavigate?: () => void;
	/** Set by ReaderShell (via Sidebar) on /graph so SSR shows the final state. */
	isGraphPage?: boolean;
	/** Set by ReaderShell (via Sidebar) on /about so SSR shows the final state. */
	isAboutPage?: boolean;
	/** Configurable pages/sites listed below the collections. */
	links?: SidebarLink[];
}

const ROW = 'flex items-center rounded-md transition-colors';
const ACTIVE = 'bg-[var(--primary)]/[0.08] text-[var(--primary)] font-medium';
const IDLE = 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border)]/40';

/**
 * The browse UI shared by the desktop inline sidebar (Sidebar.tsx) and the
 * mobile drawer (MobileNav.tsx): one tree of collections, each expanding to
 * its articles, with the graph and configurable links pinned below.
 */
export default function SidebarContent({
	collections,
	articles,
	currentSlug,
	selectedCollectionId,
	onNavigate,
	isGraphPage: graphPageProp = false,
	isAboutPage: aboutPageProp = false,
	links = [],
}: SidebarContentProps) {
	// Server-known first (via ReaderShell on /graph, so SSR shows the final
	// state with no flash); the URL check covers uses without the prop
	// (e.g. the mobile drawer).
	const [isGraphPage, setIsGraphPage] = useState<boolean>(graphPageProp);
	useEffect(() => {
		if (!graphPageProp) {
			setIsGraphPage(window.location.pathname.replace(/\/+$/, '') === '/graph');
		}
	}, [graphPageProp]);

	// Current path for highlighting configurable sidebar links. Server-known
	// first for /about (via ReaderShell, so SSR shows the final state);
	// the URL check covers the mobile drawer and other internal links.
	const normalizePath = (p: string) => p.replace(/\/+$/, '') || '/';
	const [currentPath, setCurrentPath] = useState<string>(aboutPageProp ? '/about' : '');
	useEffect(() => {
		setCurrentPath(normalizePath(window.location.pathname));
	}, []);
	const isAboutPage = aboutPageProp || currentPath === '/about';
	const isTagsPage = currentPath === '/tags' || currentPath.startsWith('/tags/');
	// Any non-collection, non-graph internal link also deselects collections.
	const noCollectionSelected =
		isGraphPage ||
		isAboutPage ||
		isTagsPage ||
		links.some((l) => !l.external && normalizePath(l.href) === currentPath);
	const isLinkActive = (link: SidebarLink) =>
		!link.external && currentPath !== '' && normalizePath(link.href) === currentPath;

	// Only the collection being viewed starts expanded.
	const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() =>
		selectedCollectionId ? { [selectedCollectionId]: true } : {}
	);
	useEffect(() => {
		if (selectedCollectionId) {
			setOpenFolders((prev) => ({ ...prev, [selectedCollectionId]: true }));
		}
	}, [selectedCollectionId]);

	const toggleFolder = (id: string) => {
		setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	return (
		<>
			<nav aria-label="Collections" className="flex-1 p-3 space-y-0.5">
				{collections.map((col) => {
					const items = articles.filter((n) => n.collection === col.id);
					const isOpen = openFolders[col.id] ?? false;
					// The collection row is active on its index page; on one of
					// its articles the article row carries the highlight instead.
					const isSelected =
						selectedCollectionId === col.id &&
						!noCollectionSelected &&
						!items.some((n) => n.slug === currentSlug);

					return (
						<div key={col.id}>
							<div className={`${ROW} ${isSelected ? ACTIVE : IDLE}`}>
								<button
									type="button"
									onClick={() => toggleFolder(col.id)}
									aria-expanded={isOpen}
									aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${col.name}`}
									className="p-1.5 shrink-0 text-[var(--text-muted)] hover:text-[var(--text-main)]"
								>
									<ChevronRight
										className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
									/>
								</button>
								<a
									href={`/${col.id}`}
									onClick={() => onNavigate?.()}
									aria-current={isSelected ? 'page' : undefined}
									title={col.description}
									className={`flex-1 truncate py-1.5 pr-2 ${isSelected ? '' : 'text-[var(--text-main)]'}`}
								>
									{col.name}
								</a>
							</div>

							{isOpen && (
								<div className="ml-[1.1rem] pl-2 border-l border-[var(--border)] space-y-0.5 py-0.5">
									{items.length === 0 ? (
										<p className="px-2 py-1.5 text-[var(--text-muted)] italic">No articles yet.</p>
									) : (
										items.map((note) => {
											const isCurrent = currentSlug === note.slug;
											return (
												<a
													key={note.slug}
													href={note.url}
													onClick={() => onNavigate?.()}
													aria-current={isCurrent ? 'page' : undefined}
													title={note.title}
													className={`${ROW} px-2 py-1.5 ${isCurrent ? ACTIVE : IDLE}`}
												>
													<span className="truncate">{note.title}</span>
												</a>
											);
										})
									)}
								</div>
							)}
						</div>
					);
				})}
			</nav>

			{/* Graph, tags and configurable pages & external sites */}
			<nav aria-label="Pages" className="p-3 space-y-0.5 border-t border-[var(--border)]">
				<a
					href="/graph"
					onClick={() => onNavigate?.()}
					aria-current={isGraphPage ? 'page' : undefined}
					title="Visualize article connections"
					className={`${ROW} px-2 py-1.5 ${isGraphPage ? ACTIVE : IDLE}`}
				>
					Knowledge Graph
				</a>
				<a
					href="/tags"
					onClick={() => onNavigate?.()}
					aria-current={isTagsPage ? 'page' : undefined}
					title="Browse every tag"
					className={`${ROW} px-2 py-1.5 ${isTagsPage ? ACTIVE : IDLE}`}
				>
					Tags
				</a>
				{links.map((link) => {
					const isActive = isLinkActive(link);
					return (
						<a
							key={link.href}
							href={link.href}
							onClick={() => onNavigate?.()}
							aria-current={isActive ? 'page' : undefined}
							title={link.description || link.label}
							target={link.external ? '_blank' : undefined}
							rel={link.external ? 'noopener noreferrer' : undefined}
							className={`${ROW} justify-between gap-2 px-2 py-1.5 ${isActive ? ACTIVE : IDLE}`}
						>
							<span className="truncate">{link.label}</span>
							{link.external && <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />}
						</a>
					);
				})}
			</nav>
		</>
	);
}
