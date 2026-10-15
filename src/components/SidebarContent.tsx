import { useEffect, useMemo, useState } from 'react';
import {
	Folder,
	Calendar,
	BookOpen,
	ChevronRight,
	ChevronDown,
	Layers,
	FileText,
	Sparkles,
	FolderOpen,
	Microscope,
	Share2,
} from 'lucide-react';
import type { ArticleMeta } from '../lib/articles';
import type { CollectionConfig } from '../lib/collections';
import { taxonomySlug } from '../lib/slugs';

interface SidebarContentProps {
	collections: CollectionConfig[];
	articles: ArticleMeta[];
	currentSlug: string;
	selectedCollectionId?: string;
	/** Called after navigation links are clicked - closes the mobile drawer. */
	onNavigate?: () => void;
}

const COLLECTION_ICONS: Record<string, any> = {
	BookOpen,
	Calendar,
	Microscope,
	FileText,
	Share2,
	Folder,
	Layers,
};

type BrowseTab = 'folder' | 'dated' | 'tags';

/**
 * The browse UI shared by the desktop inline sidebar (Sidebar.tsx) and the
 * mobile drawer (MobileNav.tsx): collection filter, folder/dated/tags tabs
 * and the branding footer.
 */
export default function SidebarContent({
	collections,
	articles,
	currentSlug,
	selectedCollectionId: initialCollectionId,
	onNavigate,
}: SidebarContentProps) {
	const [browseTab, setBrowseTab] = useState<BrowseTab>(() => {
		try {
			return (localStorage.getItem('hakushi_browse_tab') as BrowseTab) || 'folder';
		} catch {
			return 'folder';
		}
	});

	const getInitialCollection = () => {
		if (initialCollectionId) return initialCollectionId;
		if (typeof window !== 'undefined') {
			const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
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
	};

	const [selectedCollectionId, setSelectedCollectionId] = useState<string>(getInitialCollection);

	useEffect(() => {
		if (initialCollectionId) {
			setSelectedCollectionId(initialCollectionId);
		}
	}, [initialCollectionId]);
	const [activeTag, setActiveTag] = useState<string | null>(() => {
		// Prefer the tag from the URL when on a /tags/[tag] page so the
		// cloud highlights the tag shown in the main view after navigation.
		if (typeof window !== 'undefined') {
			const match = window.location.pathname.match(/^\/tags\/([^/]+)\/?$/);
			if (match) {
				const slug = decodeURIComponent(match[1]);
				const found = articles.find((n) =>
					n.tags.some((t) => taxonomySlug(t) === slug)
				);
				const name = found?.tags.find((t) => taxonomySlug(t) === slug);
				if (name) return name;
			}
		}
		try {
			return localStorage.getItem('hakushi_tag') || null;
		} catch {
			return null;
		}
	});
	const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(
		Object.fromEntries(collections.map((c) => [c.id, true]))
	);

	const selectTab = (tab: BrowseTab) => {
		setBrowseTab(tab);
		try {
			localStorage.setItem('hakushi_browse_tab', tab);
		} catch {
			/* ignore */
		}
	};

	const selectCollection = (id: string) => {
		setSelectedCollectionId(id);
		try {
			localStorage.setItem('hakushi_collection', id);
		} catch {
			/* ignore */
		}
	};

	const selectTag = (tag: string | null) => {
		setActiveTag(tag);
		try {
			if (tag) localStorage.setItem('hakushi_tag', tag);
			else localStorage.removeItem('hakushi_tag');
		} catch {
			/* ignore */
		}
	};

	const toggleFolder = (folderKey: string) => {
		setOpenFolders((prev) => ({ ...prev, [folderKey]: !prev[folderKey] }));
	};

	// Filter notes by selected collection + active tag
	const filteredNotes = useMemo(() => {
		let result = articles;
		if (selectedCollectionId !== 'all') {
			result = result.filter((n) => n.collection === selectedCollectionId);
		}
		if (activeTag) {
			result = result.filter((n) => n.tags.includes(activeTag));
		}
		return result;
	}, [articles, selectedCollectionId, activeTag]);

	// Group notes by Folder Hierarchy
	const folderTree = useMemo(() => {
		const tree: Record<string, ArticleMeta[]> = {};
		filteredNotes.forEach((note) => {
			const folderKey = note.collection || 'uncategorized';
			if (!tree[folderKey]) tree[folderKey] = [];
			tree[folderKey].push(note);
		});
		return tree;
	}, [filteredNotes]);

	// Group notes chronologically by Year-Month
	const datedTimeline = useMemo(() => {
		const timeline: Record<string, ArticleMeta[]> = {};
		const sorted = [...filteredNotes].sort((a, b) =>
			(b.date ?? '').localeCompare(a.date ?? '')
		);

		sorted.forEach((note) => {
			const yearMonth = note.date ? note.date.substring(0, 7) : 'Undated';
			if (!timeline[yearMonth]) timeline[yearMonth] = [];
			timeline[yearMonth].push(note);
		});
		return timeline;
	}, [filteredNotes]);

	// Tag counts scoped to the selected collection, consistent with the
	// folder and dated tabs which also filter by collection.
	const tagCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		const scoped =
			selectedCollectionId === 'all'
				? articles
				: articles.filter((n) => n.collection === selectedCollectionId);
		scoped.forEach((note) => {
			note.tags.forEach((tag) => {
				counts[tag] = (counts[tag] || 0) + 1;
			});
		});
		return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
	}, [articles, selectedCollectionId]);

	return (
		<>
			<div className="p-4 space-y-5">
				{/* Collection Selector Filter */}
				<div className="space-y-2">
					<p className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px] flex items-center justify-between">
						<span>Collections</span>
						<span className="font-mono text-[var(--primary)]">{articles.length} items</span>
					</p>

					<div className="space-y-1">
						<a
							href="/"
							onClick={() => {
								selectCollection('all');
								onNavigate?.();
							}}
							className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
								selectedCollectionId === 'all'
									? 'bg-[var(--primary)] text-white shadow-xs font-semibold'
									: 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
							}`}
						>
							<span className="flex items-center gap-2">
								<Layers className="w-4 h-4" />
								All Collections
							</span>
							<span className="font-mono text-[10px] opacity-80">{articles.length}</span>
						</a>

						{collections.map((col) => {
							const count = articles.filter((n) => n.collection === col.id).length;
							const isSelected = selectedCollectionId === col.id;
							const IconComponent = COLLECTION_ICONS[col.iconName ?? 'Folder'] || Folder;

							return (
								<a
									key={col.id}
									href={`/${col.id}`}
									onClick={() => {
										selectCollection(col.id);
										onNavigate?.();
									}}
									title={col.description}
									className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-medium transition-all ${
										isSelected
											? 'bg-[var(--primary)]/15 text-[var(--primary)] font-semibold border border-[var(--primary)]/30'
											: 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
									}`}
								>
									<span className="flex items-center gap-2 truncate">
										<IconComponent className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
										<span className="truncate">{col.name}</span>
									</span>
									<span className="font-mono text-[10px] text-[var(--text-muted)]">{count}</span>
								</a>
							);
						})}
					</div>
				</div>

				{/* Navigation Mode Switcher Tabs */}
				<div className="space-y-3 pt-2 border-t border-[var(--border)]">
					<div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] font-medium text-[11px]">
						{(['folder', 'dated', 'tags'] as const).map((tab) => (
							<button
								key={tab}
								onClick={() => selectTab(tab)}
								title={
									tab === 'tags' && activeTag ? `Filtered by #${activeTag}` : undefined
								}
								className={`py-1 rounded-md transition-colors flex items-center justify-center gap-1 ${
									browseTab === tab
										? 'bg-[var(--primary)] text-white font-semibold'
										: 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
								}`}
							>
								{tab === 'folder' ? 'Folders' : tab === 'dated' ? 'Dated' : 'Tags'}
								{tab === 'tags' && activeTag && (
									<span
										aria-label={`Tag filter active: ${activeTag}`}
										className="inline-block w-1.5 h-1.5 rounded-full bg-current shrink-0"
									/>
								)}
							</button>
						))}
					</div>

					{/* Tab 1: Folder Tree View */}
					{browseTab === 'folder' && (
						<div className="space-y-2">
							{filteredNotes.length === 0 ? (
								<div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-center space-y-1.5">
									{activeTag ? (
										<>
											<p className="text-[var(--text-main)] italic">
												No articles tagged #{activeTag}
												{selectedCollectionId !== 'all' ? ' in this collection' : ''}.
											</p>
											<button
												onClick={() => selectTag(null)}
												className="text-[var(--primary)] font-semibold hover:underline"
											>
												Clear tag filter
											</button>
										</>
									) : (
										<p className="text-[var(--text-muted)] italic">
											No articles here yet.
										</p>
									)}
								</div>
							) :
								(Object.entries(folderTree) as [string, ArticleMeta[]][]).map(
								([folderKey, items]) => {
									const isOpen = openFolders[folderKey] ?? true;
									const colMeta = collections.find((c) => c.id === folderKey);

									return (
										<div key={folderKey} className="space-y-1">
											<button
												onClick={() => toggleFolder(folderKey)}
												className="w-full flex items-center justify-between p-1.5 rounded-md hover:bg-[var(--bg-surface)] font-semibold text-[var(--text-main)] uppercase tracking-wider text-[11px]"
											>
												<span className="flex items-center gap-1.5 capitalize">
													{isOpen ? (
														<FolderOpen className="w-3.5 h-3.5 text-[var(--primary)]" />
													) : (
														<Folder className="w-3.5 h-3.5 text-[var(--text-muted)]" />
													)}
													{colMeta ? colMeta.name : folderKey}
												</span>
												{isOpen ? (
													<ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
												) : (
													<ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
												)}
											</button>

											{isOpen && (
												<div className="pl-3 space-y-0.5 border-l border-[var(--border)] ml-2">
													{items.map((note) => {
														const isSelected = currentSlug === note.slug;
														return (
															<a
																key={note.slug}
																href={note.url}
																onClick={() => onNavigate?.()}
																className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors text-left group ${
																	isSelected
																		? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold border-l-2 border-[var(--primary)]'
																		: 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
																}`}
															>
																<span className="truncate pr-1">{note.title}</span>
																<FileText className="w-3 h-3 text-[var(--text-muted)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
															</a>
														);
													})}
												</div>
											)}
										</div>
									);
								}
							)}
						</div>
					)}

					{/* Tab 2: Chronological Dated Archive View */}
					{browseTab === 'dated' && (
						<div className="space-y-3">
							{filteredNotes.length === 0 ? (
								<div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-center space-y-1.5">
									{activeTag ? (
										<>
											<p className="text-[var(--text-main)] italic">
												No articles tagged #{activeTag}
												{selectedCollectionId !== 'all' ? ' in this collection' : ''}.
											</p>
											<button
												onClick={() => selectTag(null)}
												className="text-[var(--primary)] font-semibold hover:underline"
											>
												Clear tag filter
											</button>
										</>
									) : (
										<p className="text-[var(--text-muted)] italic">
											No articles here yet.
										</p>
									)}
								</div>
							) :
								(Object.entries(datedTimeline) as [string, ArticleMeta[]][]).map(
								([yearMonth, items]) => (
									<div key={yearMonth} className="space-y-1">
										<div className="flex items-center gap-1.5 font-bold text-[var(--text-muted)] font-mono text-[11px] px-1">
											<Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
											<span>{yearMonth}</span>
										</div>
										<div className="pl-3 border-l border-[var(--border)] ml-2 space-y-1">
											{items.map((note) => (
												<a
													key={note.slug}
													href={note.url}
													onClick={() => onNavigate?.()}
													className={`w-full text-left p-2 rounded-md transition-colors block ${
														currentSlug === note.slug
															? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
															: 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
													}`}
												>
													<p className="truncate font-medium">{note.title}</p>
													<p className="text-[10px] text-[var(--text-muted)] font-mono">
														{note.date}
													</p>
												</a>
											))}
										</div>
									</div>
								)
							)}
						</div>
					)}

					{/* Tab 3: Tag Cloud Index View — selecting a tag navigates to
					    the tag page so the main view shows the filtered list. */}
					{browseTab === 'tags' && (
						<div className="space-y-3">
							{activeTag && (
								<div className="flex items-center justify-between p-2 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)]">
									<span className="truncate">Filtering: #{activeTag}</span>
									<a
										href="/"
										onClick={() => {
											selectTag(null);
											onNavigate?.();
										}}
										className="font-bold hover:underline shrink-0 ml-2"
									>
										Clear
									</a>
								</div>
							)}

							<div className="flex flex-wrap gap-1.5">
								{Object.entries(tagCounts).map(([tag, count]) => {
									const isActive = activeTag === tag;
									return (
										<a
											key={tag}
											href={`/tags/${taxonomySlug(tag)}`}
											onClick={() => {
												selectTag(tag);
												onNavigate?.();
											}}
											aria-current={isActive ? 'true' : undefined}
											className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all ${
												isActive
													? 'bg-[var(--primary)] text-white font-bold'
													: 'bg-[var(--bg-surface)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)]'
											}`}
										>
											<span>#{tag}</span>
											<span className="opacity-70 text-[10px]">({count})</span>
										</a>
									);
								})}
							</div>

							{activeTag && (
								<div className="space-y-1">
									<p className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px] px-1">
										{filteredNotes.length}{' '}
										{filteredNotes.length === 1 ? 'article' : 'articles'} tagged #
										{activeTag}
									</p>
									<div className="pl-3 space-y-0.5 border-l border-[var(--border)] ml-2">
										{filteredNotes.map((note) => {
											const isSelected = currentSlug === note.slug;
											return (
												<a
													key={note.slug}
													href={note.url}
													onClick={() => onNavigate?.()}
													className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors text-left group ${
														isSelected
															? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold border-l-2 border-[var(--primary)]'
															: 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
													}`}
												>
													<span className="truncate pr-1">{note.title}</span>
													<FileText className="w-3 h-3 text-[var(--text-muted)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
												</a>
											);
										})}
										{filteredNotes.length === 0 && (
											<p className="px-2 py-1.5 text-[var(--text-muted)] italic">
												No articles match this tag
												{selectedCollectionId !== 'all' ? ' in this collection' : ''}.
											</p>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Footer Info */}
			<div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-muted)] font-mono mt-6">
				<p className="flex items-center gap-1.5 font-semibold text-[var(--text-main)]">
					<BookOpen className="hidden" />
					<Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
					Hakushi
				</p>
				<p className="mt-0.5">Flexible file &amp; collection layout</p>
			</div>
		</>
	);
}
