import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import type { ArticleMeta } from '../lib/articles';

interface CommandPaletteProps {
	docs: Array<ArticleMeta & { text?: string }>;
}

function isEditableTarget(target: EventTarget | null): boolean {
	const el = target as HTMLElement | null;
	if (!el || typeof el.tagName !== 'string') return false;
	return (
		el.isContentEditable ||
		el.tagName === 'INPUT' ||
		el.tagName === 'TEXTAREA' ||
		el.tagName === 'SELECT'
	);
}

export default function CommandPalette({ docs }: CommandPaletteProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [activeIndex, setActiveIndex] = useState(0);
	const listRef = useRef<HTMLDivElement>(null);

	const openPalette = () => {
		setQuery('');
		setActiveIndex(0);
		setIsOpen(true);
	};

	useEffect(() => {
		window.addEventListener('open-command-palette', openPalette);
		return () => window.removeEventListener('open-command-palette', openPalette);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				if (isOpen) setIsOpen(false);
				else openPalette();
			} else if (e.key === 'Escape' && isOpen) {
				setIsOpen(false);
			} else if (
				!isOpen &&
				e.key === '/' &&
				!e.metaKey &&
				!e.ctrlKey &&
				!e.altKey &&
				!isEditableTarget(e.target)
			) {
				// Quick-open from anywhere except editable fields so typing
				// "/" in inputs still works.
				e.preventDefault();
				openPalette();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen]);

	useEffect(() => {
		document.body.style.overflow = isOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	const results = useMemo(() => {
		if (!query.trim()) return docs.slice(0, 6);
		const q = query.toLowerCase();
		return docs.filter(
			(n) =>
				n.title.toLowerCase().includes(q) ||
				n.tags.some((t: string) => t.toLowerCase().includes(q)) ||
				n.collection.toLowerCase().includes(q) ||
				(n.text && n.text.includes(q)) ||
				(n.category && n.category.toLowerCase().includes(q))
		);
	}, [docs, query]);

	// Restart keyboard selection whenever the result set changes.
	useEffect(() => {
		setActiveIndex(0);
	}, [query, docs]);

	const active = results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1);

	// Keep the keyboard-highlighted result visible while arrowing.
	useEffect(() => {
		listRef.current
			?.querySelector('[data-palette-active="true"]')
			?.scrollIntoView({ block: 'nearest' });
	}, [active, isOpen]);

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowDown' && results.length > 0) {
			e.preventDefault();
			setActiveIndex((i) => (i + 1) % results.length);
		} else if (e.key === 'ArrowUp' && results.length > 0) {
			e.preventDefault();
			setActiveIndex((i) => (i - 1 + results.length) % results.length);
		} else if (e.key === 'Enter' && active >= 0) {
			window.location.href = results[active].url;
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in">
			<button
				aria-label="Close search"
				className="absolute inset-0 cursor-default"
				onClick={() => setIsOpen(false)}
			/>
			<div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden flex flex-col text-xs">
				{/* Search Header */}
				<div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
					<Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
					<input
						type="text"
						autoFocus
						placeholder="Search all notes, tags, formulas, or collections..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleInputKeyDown}
						role="combobox"
						aria-expanded="true"
						aria-controls="palette-results"
						aria-activedescendant={active >= 0 ? `palette-result-${active}` : undefined}
						className="w-full bg-transparent text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
					/>
					<button
						onClick={() => setIsOpen(false)}
						className="p-1 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-muted)]"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Results List */}
				<div ref={listRef} id="palette-results" role="listbox" className="max-h-96 overflow-y-auto p-2 space-y-1">
					{results.length === 0 ? (
						<div className="p-8 text-center text-[var(--text-muted)]">
							No matching notes found for "{query}".
						</div>
					) : (
						results.map((note, idx) => (
							<a
								key={note.slug}
								id={`palette-result-${idx}`}
								role="option"
								aria-selected={idx === active}
								href={note.url}
								data-palette-active={idx === active ? 'true' : undefined}
								onMouseEnter={() => setActiveIndex(idx)}
							className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left group ${
								idx === active ? 'bg-[var(--bg-sidebar)]/70' : 'hover:bg-[var(--bg-sidebar)]/70'
							}`}
							>
								<div className="space-y-1 pr-2">
									<div className="flex items-center gap-2">
										<BookOpen className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
										<span
											className={`font-bold text-sm transition-colors ${
												idx === active
													? 'text-[var(--text-main)]'
													: 'text-[var(--text-main)]'
											}`}
										>
											{note.title}
										</span>
									</div>
									<p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
										{note.summary || note.url}
									</p>
								</div>

								<div className="flex flex-col items-end shrink-0 gap-1 text-[10px] text-[var(--text-muted)]">
									<span className="px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-semibold capitalize">
										{note.collection}
									</span>
									<span>{note.date}</span>
								</div>
							</a>
						))
					)}
				</div>

				{/* Footer info - keyboard hints are irrelevant on touch devices */}
				<div className="hidden sm:flex p-3 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)] justify-between items-center">
					<span>
						Use{' '}
						<kbd className="px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-surface)]">↑</kbd>{' '}
						<kbd className="px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-surface)]">↓</kbd> to navigate,{' '}
						<kbd className="px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-surface)]">↵</kbd> to open
					</span>
					<span>
						Press{' '}
						<kbd className="px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-surface)]">ESC</kbd> to exit
					</span>
				</div>
			</div>
		</div>
	);
}
