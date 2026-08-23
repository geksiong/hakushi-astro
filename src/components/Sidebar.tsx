import SidebarContent from './SidebarContent';
import type { ArticleMeta } from '../lib/articles';
import type { CollectionConfig } from '../lib/collections';

interface SidebarProps {
	collections: CollectionConfig[];
	articles: ArticleMeta[];
	currentSlug: string;
}

/**
 * Desktop inline navigation column (lg+ only). On smaller screens the page
 * uses the MobileNav drawer mounted globally in BaseLayout.
 */
export default function Sidebar({ collections, articles, currentSlug }: SidebarProps) {
	return (
		<aside className="w-72 shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto hidden lg:flex flex-col justify-between text-xs transition-colors duration-200">
			<SidebarContent collections={collections} articles={articles} currentSlug={currentSlug} />
		</aside>
	);
}
