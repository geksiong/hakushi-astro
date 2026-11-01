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

interface ArticleGroup {
	key: string;
	label: string;
	items: ArticleMeta[];
}

/** Second-level key of an article: its year in dated collections, its category otherwise. */
function groupKey(col: CollectionConfig, article: ArticleMeta): string | undefined {
	return col.type === 'dated' ? article.date?.slice(0, 4) : article.category;
}

/**
 * Split a collection's articles (already newest first) into second-level
 * groups - years, newest first, for dated collections; categories, A-Z,
 * otherwise - plus the articles that belong to none (undated/uncategorized).
 */
function groupArticles(col: CollectionConfig, items: ArticleMeta[]): { groups: ArticleGroup[]; loose: ArticleMeta[] } {
	const byKey = new Map<string, ArticleGroup>();
	const loose: ArticleMeta[] = [];
	for (const item of items) {
		const key = groupKey(col, item);
		if (!key) {
			loose.push(item);
			continue;
		}
		if (!byKey.has(key)) byKey.set(key, { key, label: key, items: [] });
		byKey.get(key)!.items.push(item);
	}
	const groups = [...byKey.values()].sort((a, b) =>
		col.type === 'dated' ? b.key.localeCompare(a.key) : a.label.localeCompare(b.label)
	);
	return { groups, loose };
}

const groupId = (collectionId: string, key: string) => `${collectionId}/${key}`;

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

	// Only the collection being viewed, and the group holding the current
	// article, start expanded.
	const initiallyOpen = (): Record<string, boolean> => {
		if (!selectedCollectionId) return {};
		const open: Record<string, boolean> = { [selectedCollectionId]: true };
		const col = collections.find((c) => c.id === selectedCollectionId);
		const current = articles.find((n) => n.collection === selectedCollectionId && n.slug === currentSlug);
		const key = col && current ? groupKey(col, current) : undefined;
		if (key) open[groupId(selectedCollectionId, key)] = true;
		return open;
	};
	const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(initiallyOpen);
	useEffect(() => {
		setOpenFolders((prev) => ({ ...prev, ...initiallyOpen() }));
	}, [selectedCollectionId, currentSlug]);

	const toggleFolder = (id: string) => {
		setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	return (
		<>
			<nav aria-label="Collections" className="flex-1 p-3 space-y-0.5">
				{collections.map((col) => {
					// Newest first, undated last: the collection page's default order.
					const items = articles
						.filter((n) => n.collection === col.id)
						.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
					const isOpen = openFolders[col.id] ?? false;
					const { groups, loose } = groupArticles(col, items);
					const renderArticle = (note: ArticleMeta) => {
						const isCurrent = currentSlug === note.slug;
						return (
							<a
								key={note.slug}
								href={note.url}
								onClick={() => onNavigate?.()}
								aria-current={isCurrent ? 'page' : undefined}
								title={note.title}
								className={`${ROW} gap-2 px-2 py-1.5 ${isCurrent ? ACTIVE : IDLE}`}
							>
								{col.type === 'dated' && note.date && (
									<time dateTime={note.date} className="shrink-0 text-xs tabular-nums opacity-70">
										{note.date}
									</time>
								)}
								<span className="truncate">{note.title}</span>
							</a>
						);
					};
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
										<>
											{groups.map((group) => {
												const id = groupId(col.id, group.key);
												const groupOpen = openFolders[id] ?? false;
												return (
													<div key={id}>
														<button
															type="button"
															onClick={() => toggleFolder(id)}
															aria-expanded={groupOpen}
															title={`${group.label} · ${group.items.length}`}
															className={`${ROW} w-full gap-1 px-1 py-1.5 text-left ${IDLE}`}
														>
															<ChevronRight
																className={`w-3.5 h-3.5 shrink-0 transition-transform ${groupOpen ? 'rotate-90' : ''}`}
															/>
															<span className="truncate">{group.label}</span>
															<span className="ml-auto pl-2 text-xs opacity-60 tabular-nums">{group.items.length}</span>
														</button>
														{groupOpen && (
															<div className="ml-[0.6rem] pl-2 border-l border-[var(--border)] space-y-0.5 py-0.5">
																{group.items.map(renderArticle)}
															</div>
														)}
													</div>
												);
											})}
											{loose.map(renderArticle)}
										</>
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
