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

/**
 * Desktop inline navigation column (lg+ only). On smaller screens the page
 * uses the MobileNav drawer mounted globally in BaseLayout.
 */
export default function Sidebar(props: SidebarProps) {
	return (
		<aside
			id="left-sidebar"
			data-sidebar
			className="shrink-0 w-64 border-r border-[var(--border)] h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto hidden lg:flex flex-col text-xs"
		>
			<SidebarContent {...props} />
		</aside>
	);
}
