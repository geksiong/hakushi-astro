import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X, LayoutGrid, List } from 'lucide-react';
import type { ArticleMeta } from '../lib/articles';
import type { CollectionConfig } from '../lib/collections';

interface CollectionBrowserProps {
	collection: CollectionConfig;
	articles: ArticleMeta[];
	articlesPerPage?: number;
	collections?: CollectionConfig[];
}

type SortOrder = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export default function CollectionBrowser({
	collection,
	articles,
	articlesPerPage = 12,
	collections = [],
}: CollectionBrowserProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
	const [listingLayout, setListingLayout] = useState<'grid' | 'list'>('grid');

	useEffect(() => {
		try {
			setListingLayout(localStorage.getItem(`hakushi_listing_layout:${collection.id}`) === 'list' ? 'list' : 'grid');
		} catch {
			setListingLayout('grid');
		}
	}, [collection.id]);

	const changeListingLayout = (layout: 'grid' | 'list') => {
		setListingLayout(layout);
		try { localStorage.setItem(`hakushi_listing_layout:${collection.id}`, layout); } catch { /* storage can be unavailable */ }
	};

	const pageSize = Math.max(1, articlesPerPage);

	const [currentPage, setCurrentPage] = useState<number>(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const p = parseInt(params.get('page') || '1', 10);
			return isNaN(p) || p < 1 ? 1 : p;
		}
		return 1;
	});

	// Synchronize with URL search params (e.g. Back/Forward navigation)
	useEffect(() => {
		const handlePopState = () => {
			const params = new URLSearchParams(window.location.search);
			const p = parseInt(params.get('page') || '1', 10);
			setCurrentPage(isNaN(p) || p < 1 ? 1 : p);
		};
		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	// Filter and sort articles
	const filteredArticles = useMemo(() => {
		let list = [...articles];

		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			list = list.filter((a) => {
				const titleMatch = a.title.toLowerCase().includes(q);
				const summaryMatch = (a.summary ?? '').toLowerCase().includes(q);
				const authorMatch = (a.author ?? '').toLowerCase().includes(q);
				const categoryMatch = (a.category ?? '').toLowerCase().includes(q);
				const tagMatch = a.tags.some((t) => t.toLowerCase().includes(q));
				return titleMatch || summaryMatch || authorMatch || categoryMatch || tagMatch;
			});
		}

		list.sort((a, b) => {
			if (sortOrder === 'newest') {
				return (b.date ?? '').localeCompare(a.date ?? '');
			}
			if (sortOrder === 'oldest') {
				return (a.date ?? '').localeCompare(b.date ?? '');
			}
			if (sortOrder === 'title-asc') {
				return a.title.localeCompare(b.title);
			}
			if (sortOrder === 'title-desc') {
				return b.title.localeCompare(a.title);
			}
			return 0;
		});

		return list;
	}, [articles, searchQuery, sortOrder]);

	// Pagination calculations
	const totalItems = filteredArticles.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const safePage = Math.min(Math.max(1, currentPage), totalPages);

	const startIndex = (safePage - 1) * pageSize;
	const endIndex = Math.min(startIndex + pageSize, totalItems);
	const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

	// Change page and update URL
	const goToPage = (page: number) => {
		const target = Math.min(Math.max(1, page), totalPages);
		setCurrentPage(target);
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			if (target === 1) {
				url.searchParams.delete('page');
			} else {
				url.searchParams.set('page', String(target));
			}
			window.history.pushState(null, '', url.toString());
			// Scroll smoothly to top of browser
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	// Reset page to 1 when search query or sort order changes
	const handleSearchChange = (val: string) => {
		setSearchQuery(val);
		goToPage(1);
	};

	const handleSortChange = (newSort: SortOrder) => {
		setSortOrder(newSort);
		goToPage(1);
	};

	const isAll = collection.id === 'all';

	const getCollectionName = (id: string) =>
		collections.find((c) => c.id === id)?.name ?? id;

	// Helper to generate page number array with ellipsis
	const getPageNumbers = () => {
		if (totalPages <= 7) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}
		const pages: (number | string)[] = [1];
		if (safePage > 3) {
			pages.push('...');
		}
		const start = Math.max(2, safePage - 1);
		const end = Math.min(totalPages - 1, safePage + 1);
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		if (safePage < totalPages - 2) {
			pages.push('...');
		}
		pages.push(totalPages);
		return pages;
	};

	// Pagination controls - only rendered when there is more than one page
	const pagination =
		totalPages > 1 ? (
			<nav aria-label="Collection pagination" className="flex items-center justify-center gap-1 text-xs">
				<button
					onClick={() => goToPage(safePage - 1)}
					disabled={safePage <= 1}
					className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					aria-label="Previous page"
				>
					<ChevronLeft className="w-4 h-4" />
					<span className="hidden sm:inline">Previous</span>
				</button>

				{getPageNumbers().map((p, idx) => {
					if (typeof p === 'string') {
						return (
							<span key={`ellipsis-${idx}`} className="px-2 py-1 text-[var(--text-muted)]">
								…
							</span>
						);
					}
					const isCurrent = p === safePage;
					return (
						<button
							key={`page-${p}`}
							onClick={() => goToPage(p)}
							aria-current={isCurrent ? 'page' : undefined}
							className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
								isCurrent
									? 'text-[var(--text-main)] font-semibold bg-[var(--border)]/40'
									: 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
							}`}
						>
							{p}
						</button>
					);
				})}

				<button
					onClick={() => goToPage(safePage + 1)}
					disabled={safePage >= totalPages}
					className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					aria-label="Next page"
				>
					<span className="hidden sm:inline">Next</span>
					<ChevronRight className="w-4 h-4" />
				</button>
			</nav>
		) : null;

	const layoutButton = (layout: 'grid' | 'list', label: string, Icon: typeof List) => (
		<button
			type="button"
			onClick={() => changeListingLayout(layout)}
			aria-pressed={listingLayout === layout}
			aria-label={label}
			title={label}
			className={`p-1.5 rounded-md transition-colors ${
				listingLayout === layout
					? 'text-[var(--text-main)] bg-[var(--border)]/40'
					: 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
			}`}
		>
			<Icon className="w-4 h-4" />
		</button>
	);

	// Article metadata line: collection (only when mixing collections),
	// date and reading time.
	const metaLine = (article: ArticleMeta) =>
		[isAll ? getCollectionName(article.collection) : null, article.date, `${article.readingTime.minutes} min read`]
			.filter(Boolean)
			.join(' · ');

	return (
		<div className="collection-browser-container space-y-8 animate-in fade-in">
			{/* Collection Header */}
			<header className="space-y-2">
				{!isAll && (
					<a href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
						All collections
					</a>
				)}
				<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-heading">
					{collection.name}
				</h1>
				{collection.description && (
					<p className="text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">{collection.description}</p>
				)}
			</header>

			{/* Filter, sort and layout toolbar */}
			<div className="flex items-center gap-3 pb-4 border-b border-[var(--border)] text-xs">
				<div className="relative flex-1 min-w-0">
					<Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => handleSearchChange(e.target.value)}
						placeholder="Filter articles"
						aria-label="Filter articles by title, summary, tags or author"
						className="w-full pl-6 pr-7 py-1.5 bg-transparent text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden"
					/>
					{searchQuery && (
						<button
							onClick={() => handleSearchChange('')}
							className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
							title="Clear filter"
							aria-label="Clear filter"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</div>

				<select
					value={sortOrder}
					onChange={(e) => handleSortChange(e.target.value as SortOrder)}
					aria-label="Sort articles"
					className="py-1.5 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] focus:outline-hidden cursor-pointer"
				>
					<option value="newest">Newest first</option>
					<option value="oldest">Oldest first</option>
					<option value="title-asc">Title (A–Z)</option>
					<option value="title-desc">Title (Z–A)</option>
				</select>

				<div className="flex items-center" role="group" aria-label="Listing layout">
					{layoutButton('grid', 'Grid view', LayoutGrid)}
					{layoutButton('list', 'List view', List)}
				</div>
			</div>

			{/* Articles Listing */}
			{paginatedArticles.length === 0 ? (
				<div className="py-12 text-center space-y-2 text-sm">
					<p className="text-[var(--text-main)]">
						{searchQuery ? 'No articles match your filter.' : isAll ? 'No articles yet.' : 'No articles in this collection yet.'}
					</p>
					{searchQuery && (
						<button onClick={() => handleSearchChange('')} className="text-xs text-[var(--primary)] hover:underline">
							Clear filter
						</button>
					)}
				</div>
			) : listingLayout === 'grid' ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
					{paginatedArticles.map((article) => (
						<a key={article.slug} href={article.url} className="group flex flex-col">
							{article.mainImage && (
								<img src={article.mainImage} alt="" loading="lazy" className="w-full aspect-[16/10] object-cover rounded-lg mb-3" />
							)}
							<h2 className="font-heading font-semibold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">
								{article.title}
							</h2>
							{article.summary && <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-1">{article.summary}</p>}
							<p className="text-xs text-[var(--text-muted)] mt-2">{metaLine(article)}</p>
						</a>
					))}
				</div>
			) : (
				<div className="divide-y divide-[var(--border)]">
					{paginatedArticles.map((article) => (
						<a key={article.slug} href={article.url} className="group flex gap-5 py-5 first:pt-0">
							<div className="min-w-0 flex-1 space-y-1">
								<h2 className="text-lg font-semibold tracking-tight text-[var(--text-main)] font-heading group-hover:text-[var(--primary)] transition-colors">
									{article.title}
								</h2>
								{article.summary && (
									<p className="text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">{article.summary}</p>
								)}
								<p className="text-xs text-[var(--text-muted)] pt-1">{metaLine(article)}</p>
							</div>
							{article.mainImage && (
								<img src={article.mainImage} alt="" loading="lazy" className="w-24 sm:w-36 aspect-[4/3] shrink-0 object-cover rounded-md" />
							)}
						</a>
					))}
				</div>
			)}

			{pagination}
		</div>
	);
}
