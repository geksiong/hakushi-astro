import { useEffect, useState } from 'react';
import { BookOpen, Share2, X } from 'lucide-react';
import SidebarContent from './SidebarContent';
import type { ArticleMeta } from '../lib/articles';
import type { CollectionConfig } from '../lib/collections';

interface MobileNavProps {
	collections: CollectionConfig[];
	articles: ArticleMeta[];
}

/**
 * Site-wide off-canvas navigation drawer for screens below lg. Mounted once
 * in BaseLayout so every page (graph, tags, categories, 404 - not just
 * articles) has a working hamburger menu. Opens via the `open-sidebar`
 * window event dispatched by the header hamburger button.
 */
export default function MobileNav({ collections, articles }: MobileNavProps) {
	const [open, setOpen] = useState(false);
	// Resolved after hydration to avoid an SSR/CSR markup mismatch; drives the
	// active-item highlight inside the shared browse content.
	const [currentSlug, setCurrentSlug] = useState('');

	useEffect(() => {
		setCurrentSlug(window.location.pathname.replace(/^\/+|\/+$/g, ''));
	}, []);

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

				{/* View switcher (the header pill is hidden below md) */}
				<nav className="grid grid-cols-2 gap-1 p-1 mx-4 mt-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] font-medium text-[11px]">
					<a
						href="/"
						onClick={close}
						className="flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
					>
						<BookOpen className="w-3.5 h-3.5" />
						Reader
					</a>
					<a
						href="/graph"
						onClick={close}
						className="flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
					>
						<Share2 className="w-3.5 h-3.5" />
						Graph
					</a>
				</nav>

				<SidebarContent
					collections={collections}
					articles={articles}
					currentSlug={currentSlug}
					onNavigate={close}
				/>
			</aside>
		</>
	);
}
