import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import SidebarContent from './SidebarContent';
import type { ArticleMeta } from '../lib/articles';
import type { CollectionConfig } from '../lib/collections';
import type { SidebarLink } from '../lib/sidebar';

interface MobileNavProps {
	collections: CollectionConfig[];
	articles: ArticleMeta[];
	links?: SidebarLink[];
}

/**
 * Site-wide off-canvas navigation drawer for screens below lg. Mounted once
 * in BaseLayout so every page (graph, tags, categories, 404 - not just
 * articles) has a working hamburger menu. Opens via the `open-sidebar`
 * window event dispatched by the header hamburger button.
 */
export default function MobileNav({ collections, articles, links = [] }: MobileNavProps) {
	const [open, setOpen] = useState(false);
	const [currentSlug, setCurrentSlug] = useState('');
	const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>(undefined);

	useEffect(() => {
		const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
		setCurrentSlug(cleanPath);
		if (cleanPath === '') {
			setSelectedCollectionId('all');
			return;
		}
		const firstSegment = cleanPath.split('/')[0];
		if (collections.some((c) => c.id === firstSegment)) {
			setSelectedCollectionId(firstSegment);
		}
	}, [collections]);

	useEffect(() => {
		const open = () => setOpen(true);
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		window.addEventListener('open-sidebar', open);
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('open-sidebar', open);
			window.removeEventListener('keydown', onKeyDown);
		};
	}, []);

	useEffect(() => {
		document.body.style.overflow = open ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	const close = () => setOpen(false);

	return (
		<>
			{open && (
				<div
					className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in"
					onClick={close}
					aria-hidden="true"
				/>
			)}

			<aside
				aria-label="Site navigation"
				className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full overflow-y-auto flex flex-col justify-between bg-[var(--bg-sidebar)] border-r border-[var(--border)] shadow-2xl text-xs transition-transform duration-200 ease-out lg:hidden ${
					open ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				{/* Drawer chrome */}
				<div className="flex items-center justify-between pl-4 pr-3 pt-3">
					<span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
						Browse
					</span>
					<button
						onClick={close}
						aria-label="Close navigation menu"
						className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-muted)]"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Browse content (collections, graph link, tabs) */}
				<SidebarContent
					collections={collections}
					articles={articles}
					currentSlug={currentSlug}
					selectedCollectionId={selectedCollectionId}
					onNavigate={close}
					links={links}
				/>
			</aside>
		</>
	);
}
