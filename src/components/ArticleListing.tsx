import { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import type { CollectionConfig } from '../lib/collections';

export interface ListingArticle {
	title: string;
	summary: string;
	date: string;
	url: string;
	collection: string;
	mainImage?: string;
}

interface Props {
	articles: ListingArticle[];
	collections: CollectionConfig[];
	storageKey: string;
}

export default function ArticleListing({ articles, collections, storageKey }: Props) {
	const [layout, setLayout] = useState<'grid' | 'list'>('grid');

	useEffect(() => {
		try {
			setLayout(localStorage.getItem(storageKey) === 'list' ? 'list' : 'grid');
		} catch {
			setLayout('grid');
		}
	}, [storageKey]);

	const changeLayout = (next: 'grid' | 'list') => {
		setLayout(next);
		try { localStorage.setItem(storageKey, next); } catch { /* storage can be unavailable */ }
	};

	const collectionName = (id: string) => collections.find((collection) => collection.id === id)?.name ?? id;

	return (
		<section aria-label="Articles" className="space-y-4">
			<div className="flex justify-end">
				<div className="inline-flex rounded-lg border border-[var(--border)] p-1" role="group" aria-label="Listing layout">
					<button type="button" onClick={() => changeLayout('grid')} aria-pressed={layout === 'grid'} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${layout === 'grid' ? 'bg-[var(--bg-surface)] text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}><LayoutGrid className="w-4 h-4" />Grid</button>
					<button type="button" onClick={() => changeLayout('list')} aria-pressed={layout === 'list'} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${layout === 'list' ? 'bg-[var(--bg-surface)] text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}><List className="w-4 h-4" />List</button>
				</div>
			</div>
			<div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
				{articles.map((article) => (
					<a key={article.url} href={article.url} className={`group overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)] transition-colors shadow-2xs ${layout === 'list' ? 'flex items-stretch' : 'flex flex-col'}`}>
						{article.mainImage && <img src={article.mainImage} alt="" loading="lazy" className={layout === 'grid' ? 'w-full aspect-[16/10] object-cover' : 'w-24 sm:w-40 shrink-0 object-cover'} />}
						<div className="min-w-0 p-4 flex-1">
							<h2 className="font-semibold text-sm text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">{article.title}</h2>
							{article.summary && <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1.5">{article.summary}</p>}
							<div className="flex flex-wrap justify-between gap-2 mt-3 text-[11px] font-mono text-[var(--text-muted)]"><span>{collectionName(article.collection)}</span><span>{article.date}</span></div>
						</div>
					</a>
				))}
			</div>
		</section>
	);
}
