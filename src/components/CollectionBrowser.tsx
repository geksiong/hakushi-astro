import React, { useEffect, useMemo, useState } from 'react';
import {
	BookOpen,
	Calendar,
	Clock,
	User,
	Tag,
	Folder,
	Microscope,
	FileText,
	Share2,
	ChevronLeft,
	ChevronRight,
	ArrowRight,
	Search,
	X,
	SlidersHorizontal,
	Layers,
} from 'lucide-react';
import type { ArticleMeta } from '../lib/articles';
import type { CollectionConfig } from '../lib/collections';
import { taxonomySlug } from '../lib/slugs';

interface CollectionBrowserProps {
	collection: CollectionConfig;
	articles: ArticleMeta[];
	articlesPerPage?: number;
	collections?: CollectionConfig[];
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

type SortOrder = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export default function CollectionBrowser({
	collection,
	articles,
	articlesPerPage = 5,
	collections = [],
}: CollectionBrowserProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
	const [pageSize, setPageSize] = useState<number>(articlesPerPage);

	useEffect(() => {
		setPageSize(articlesPerPage);
	}, [articlesPerPage]);

	const pageSizeOptions = useMemo(() => {
		const set = new Set([articlesPerPage, 3, 5, 10, 20]);
		return Array.from(set).sort((a, b) => a - b);
	}, [articlesPerPage]);

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

	// Reset page to 1 when search query, sort order, or pageSize changes
	const handleSearchChange = (val: string) => {
		setSearchQuery(val);
		goToPage(1);
	};

	const handlePageSizeChange = (newSize: number) => {
		setPageSize(newSize);
		goToPage(1);
	};

	const handleSortChange = (newSort: SortOrder) => {
		setSortOrder(newSort);
		goToPage(1);
	};

	const IconComponent = COLLECTION_ICONS[collection.iconName ?? 'Folder'] || Folder;
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

	return (
		<div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
			{/* Breadcrumb Path */}
			<div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
				{isAll ? (
					<span className="text-[var(--text-main)] font-semibold flex items-center gap-1.5">
						<Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
						{collection.name}
					</span>
				) : (
					<>
						<a href="/" className="hover:text-[var(--primary)] transition-colors flex items-center gap-1">
							<Layers className="w-3.5 h-3.5" />
							<span>Collections</span>
						</a>
						<ChevronRight className="w-3.5 h-3.5" />
						<span className="text-[var(--text-main)] font-semibold flex items-center gap-1.5">
							<IconComponent className="w-3.5 h-3.5 text-[var(--accent)]" />
							{collection.name}
						</span>
					</>
				)}
			</div>

			{/* Collection Header Banner */}
			<header className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-start sm:items-center gap-3">
						<div className="p-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
							<IconComponent className="w-7 h-7" />
						</div>
						<div>
							<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-heading">
								{collection.name}
							</h1>
							{collection.description && (
								<p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
									{collection.description}
								</p>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs">
						<span className="px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold">
							{articles.length} {articles.length === 1 ? 'article' : 'articles'}
						</span>
						<span className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text-muted)] capitalize">
							{isAll ? 'Mixed' : collection.type === 'dated' ? 'Chronological' : 'Folder'}
						</span>
					</div>
				</div>

				{/* Search & Sort Controls Toolbar */}
				<div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
					{/* Search input */}
					<div className="relative flex-1">
						<Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder={
								isAll
									? 'Search across all collections (title, summary, tags, author)...'
									: 'Search in this collection (title, summary, tags, author)...'
							}
							className="w-full pl-9 pr-8 py-2 rounded-lg bg-[var(--bg-sidebar)] border border-[var(--border)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
						/>
						{searchQuery && (
							<button
								onClick={() => handleSearchChange('')}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
								title="Clear search"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					{/* Sort & PageSize controls */}
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5 text-[var(--text-muted)]">
							<SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
							<select
								value={sortOrder}
								onChange={(e) => handleSortChange(e.target.value as SortOrder)}
								className="py-1.5 px-2.5 rounded-lg bg-[var(--bg-sidebar)] border border-[var(--border)] text-[var(--text-main)] font-medium focus:outline-hidden focus:border-[var(--primary)]"
							>
								<option value="newest">Newest first</option>
								<option value="oldest">Oldest first</option>
								<option value="title-asc">Title (A–Z)</option>
								<option value="title-desc">Title (Z–A)</option>
							</select>
						</div>

						<div className="flex items-center gap-1.5 text-[var(--text-muted)]">
							<span className="hidden sm:inline">Per page:</span>
							<select
								value={pageSize}
								onChange={(e) => handlePageSizeChange(Number(e.target.value))}
								className="py-1.5 px-2 rounded-lg bg-[var(--bg-sidebar)] border border-[var(--border)] text-[var(--text-main)] font-mono font-medium focus:outline-hidden focus:border-[var(--primary)]"
								title="Articles per page"
							>
								{pageSizeOptions.map((opt) => (
									<option key={opt} value={opt}>
										{opt} {opt === articlesPerPage ? '(default)' : ''}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</header>

			{/* Articles Listing */}
			{paginatedArticles.length === 0 ? (
				<div className="p-12 text-center rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border)] space-y-3">
					<Folder className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-50" />
					<p className="font-semibold text-[var(--text-main)]">
						{searchQuery ? 'No articles match your search' : isAll ? 'No articles yet' : 'No articles in this collection'}
					</p>
					{searchQuery && (
						<p className="text-xs text-[var(--text-muted)]">
							Try searching with different keywords or{' '}
							<button
								onClick={() => handleSearchChange('')}
								className="text-[var(--primary)] underline font-medium"
							>
								clear filter
							</button>
							.
						</p>
					)}
				</div>
			) : (
				<div className="space-y-4">
					{paginatedArticles.map((article) => (
						<article
							key={article.slug}
							className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/60 hover:shadow-md transition-all group relative space-y-3"
						>
							{/* Top meta row: Category & Date */}
							<div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[var(--text-muted)]">
								<div className="flex items-center gap-2">
									{article.category ? (
										<a
											href={`/categories/${taxonomySlug(article.category)}`}
											className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold hover:bg-[var(--accent)]/20 transition-colors"
										>
											<Folder className="w-3 h-3" />
											<span>{article.category}</span>
										</a>
									) : (
										<span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
											<FileText className="w-3 h-3" />
											<span className="capitalize">
												{isAll ? getCollectionName(article.collection) : collection.name}
											</span>
										</span>
									)}
									{isAll && (
										<a
											href={`/${article.collection}`}
											className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
										>
											<Layers className="w-3 h-3" />
											<span className="capitalize">{getCollectionName(article.collection)}</span>
										</a>
									)}
								</div>

								{article.date && (
									<div className="flex items-center gap-1.5 text-[var(--text-muted)]">
										<Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
										<span>{article.date}</span>
									</div>
								)}
							</div>

							{/* Article Title */}
							<div>
								<h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors font-heading">
									<a href={article.url} className="inline-flex items-center gap-2">
										<span>{article.title}</span>
										<ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--primary)] shrink-0" />
									</a>
								</h2>
							</div>

							{/* Summary */}
							{article.summary ? (
								<p className="text-sm text-[var(--text-muted)] line-clamp-2 sm:line-clamp-3 leading-relaxed">
									{article.summary}
								</p>
							) : (
								<p className="text-xs text-[var(--text-muted)] italic">
									No summary provided for this article.
								</p>
							)}

							{/* Bottom meta row: Reading time, Author, Tags, Slug */}
							<div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
								<div className="flex flex-wrap items-center gap-4">
									{article.readingTime && (
										<span className="flex items-center gap-1.5 font-medium">
											<Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
											<span>{article.readingTime.minutes} min read</span>
										</span>
									)}

									{article.author && (
										<span className="flex items-center gap-1.5 font-medium">
											<User className="w-3.5 h-3.5 text-[var(--secondary)]" />
											<span>{article.author}</span>
										</span>
									)}
								</div>

								{/* Tags */}
								{article.tags.length > 0 && (
									<div className="flex flex-wrap items-center gap-1.5">
										{article.tags.map((tag) => (
											<a
												key={tag}
												href={`/tags/${taxonomySlug(tag)}`}
												className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-mono text-[11px] font-medium hover:bg-[var(--primary)] hover:text-white transition-colors"
											>
												<Tag className="w-2.5 h-2.5" />
												<span>#{tag}</span>
											</a>
										))}
									</div>
								)}
							</div>
						</article>
					))}
				</div>
			)}

			{/* Pagination Controls Footer */}
			{totalItems > 0 && (
				<nav
					aria-label="Collection pagination"
					className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono"
				>
					{/* Status counter */}
					<div className="text-[var(--text-muted)]">
						Showing <span className="font-semibold text-[var(--text-main)]">{startIndex + 1}</span>–
						<span className="font-semibold text-[var(--text-main)]">{endIndex}</span> of{' '}
						<span className="font-semibold text-[var(--text-main)]">{totalItems}</span> articles
					</div>

					{/* Navigation buttons */}
					<div className="flex items-center gap-1">
						{/* Previous Button */}
						<button
							onClick={() => goToPage(safePage - 1)}
							disabled={safePage <= 1}
							className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg-main)] disabled:hover:text-[var(--text-main)] disabled:hover:border-[var(--border)] transition-all font-sans font-medium"
							aria-label="Previous page"
						>
							<ChevronLeft className="w-4 h-4" />
							<span className="hidden sm:inline">Previous</span>
						</button>

						{/* Page number buttons */}
						<div className="flex items-center gap-1 mx-1">
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
										key={p}
										onClick={() => goToPage(p)}
										aria-current={isCurrent ? 'page' : undefined}
										className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all ${
											isCurrent
												? 'bg-[var(--primary)] text-white shadow-xs'
												: 'border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-main)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
										}`}
									>
										{p}
									</button>
								);
							})}
						</div>

						{/* Next Button */}
						<button
							onClick={() => goToPage(safePage + 1)}
							disabled={safePage >= totalPages}
							className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg-main)] disabled:hover:text-[var(--text-main)] disabled:hover:border-[var(--border)] transition-all font-sans font-medium"
							aria-label="Next page"
						>
							<span className="hidden sm:inline">Next</span>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</nav>
			)}
		</div>
	);
}
