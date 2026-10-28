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
		<section aria-label="Articles" className="space-y-6">
			<div className="flex justify-end pb-4 border-b border-[var(--border)]" role="group" aria-label="Listing layout">
				{([['grid', 'Grid view', LayoutGrid], ['list', 'List view', List]] as const).map(([value, label, Icon]) => (
					<button
						key={value}
						type="button"
						onClick={() => changeLayout(value)}
						aria-pressed={layout === value}
						aria-label={label}
						title={label}
						className={`p-1.5 rounded-md transition-colors ${layout === value ? 'text-[var(--text-main)] bg-[var(--border)]/40' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
					>
						<Icon className="w-4 h-4" />
					</button>
				))}
			</div>
			<div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10' : 'divide-y divide-[var(--border)]'}>
				{articles.map((article) => (
					<a key={article.url} href={article.url} className={`group ${layout === 'list' ? 'flex gap-5 py-5 first:pt-0' : 'flex flex-col'}`}>
						{layout === 'grid' && article.mainImage && <img src={article.mainImage} alt="" loading="lazy" className="w-full aspect-[16/10] object-cover rounded-lg mb-3" />}
						<div className="min-w-0 flex-1">
							<h2 className="font-heading font-semibold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">{article.title}</h2>
							{article.summary && <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-1">{article.summary}</p>}
							<p className="text-xs text-[var(--text-muted)] mt-2">{[collectionName(article.collection), article.date].filter(Boolean).join(' · ')}</p>
						</div>
						{layout === 'list' && article.mainImage && <img src={article.mainImage} alt="" loading="lazy" className="w-24 sm:w-36 aspect-[4/3] shrink-0 object-cover rounded-md" />}
					</a>
				))}
			</div>
		</section>
	);
}
