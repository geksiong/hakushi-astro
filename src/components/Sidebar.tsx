import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
 *
 * Collapsible: click the toggle to shrink to a narrow strip or expand back.
 * State is persisted to localStorage.
 */
export default function Sidebar({ collections, articles, currentSlug }: SidebarProps) {
	const [collapsed, setCollapsed] = useState<boolean>(() => {
		try {
			return localStorage.getItem('hakushi_sidebar_collapsed') === 'true';
		} catch {
			return false;
		}
	});

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

	return (
		<aside
			className={`shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto hidden lg:flex flex-col text-xs transition-all duration-300 ${
				collapsed ? 'w-10' : 'w-72'
			}`}
		>
			{/* Toggle button */}
			<div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-end'} p-1.5 border-b border-[var(--border)]`}>
				<button
					onClick={toggle}
					title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
				>
					{collapsed ? (
						<PanelLeftOpen className="w-4 h-4" />
					) : (
						<PanelLeftClose className="w-4 h-4" />
					)}
				</button>
			</div>

			{/* Content - hidden when collapsed */}
			{!collapsed && (
				<div className="flex-1 flex flex-col justify-between overflow-y-auto">
					<SidebarContent collections={collections} articles={articles} currentSlug={currentSlug} />
				</div>
			)}
		</aside>
	);
}
