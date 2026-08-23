import { useEffect, useRef, useState } from 'react';
import {
	Sun,
	Moon,
	Monitor,
	SlidersHorizontal,
	Palette as PaletteIcon,
	X,
	type LucideIcon,
} from 'lucide-react';
import {
	COLOR_SCHEMES,
	THEME_STYLES,
	applyTheme,
	readStoredTheme,
	type ThemeMode,
	type ColorSchemeId,
	type ThemeStyleId,
} from '../lib/theme';

const MODE_ICONS: Record<ThemeMode, LucideIcon> = { light: Sun, dark: Moon, auto: Monitor };

export default function ThemeMenu() {
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const initial = readStoredTheme();
	const [mode, setMode] = useState<ThemeMode>(initial.mode);
	const [schemeId, setSchemeId] = useState<ColorSchemeId>(initial.schemeId);
	const [styleId, setStyleId] = useState<ThemeStyleId>(initial.styleId);

	const selectMode = (m: ThemeMode) => {
		setMode(m);
		localStorage.setItem('hakushi_mode', m);
		applyTheme(m, schemeId, styleId);
	};

	const selectScheme = (id: ColorSchemeId) => {
		setSchemeId(id);
		localStorage.setItem('hakushi_scheme', id);
		applyTheme(mode, id, styleId);
	};

	const selectStyle = (id: ThemeStyleId) => {
		setStyleId(id);
		localStorage.setItem('hakushi_style', id);
		applyTheme(mode, schemeId, id);
	};

	useEffect(() => {
		if (!showMenu) return;
		const onDown = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
		};
		document.addEventListener('mousedown', onDown);
		return () => document.removeEventListener('mousedown', onDown);
	}, [showMenu]);

	return (
		<div className="relative" ref={menuRef}>
			<button
				onClick={() => setShowMenu(!showMenu)}
				title="Customize Themes & Colors"
				className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-sidebar)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] transition-colors"
			>
				<PaletteIcon className="w-4 h-4 text-[var(--accent)]" />
			</button>

			{showMenu && (
				<div className="absolute right-0 top-full mt-2 w-[min(18rem,calc(100vw_-_2rem))] p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl z-50 space-y-4 text-xs animate-in fade-in slide-in-from-top-2">
					<div className="flex items-center justify-between pb-2 border-b border-[var(--border)] font-bold text-[var(--text-main)]">
						<span className="flex items-center gap-1.5">
							<SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" />
							Theme Customizer
						</span>
						<button
							onClick={() => setShowMenu(false)}
							className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					</div>

					{/* Dark/Light Mode */}
					<div>
						<p className="font-semibold text-[var(--text-muted)] mb-2">Appearance</p>
						<div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-sidebar)] rounded-lg border border-[var(--border)]">
							{(['light', 'dark', 'auto'] as const).map((m) => {
								const Icon = MODE_ICONS[m];
								return (
									<button
										key={m}
										onClick={() => selectMode(m)}
										className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] capitalize font-medium transition-colors ${
											mode === m
												? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-2xs'
												: 'text-[var(--text-muted)]'
										}`}
									>
										<Icon className="w-3 h-3" />
										{m}
									</button>
								);
							})}
						</div>
					</div>

					{/* Color Scheme Picker */}
					<div>
						<p className="font-semibold text-[var(--text-muted)] mb-2">Color Scheme</p>
						<div className="grid grid-cols-2 gap-1.5">
							{Object.values(COLOR_SCHEMES).map((scheme) => (
								<button
									key={scheme.id}
									onClick={() => selectScheme(scheme.id)}
									className={`p-2 rounded-lg border text-left transition-all ${
										schemeId === scheme.id
											? 'border-[var(--primary)] bg-[var(--primary)]/10 font-bold'
											: 'border-[var(--border)] bg-[var(--bg-sidebar)] hover:bg-[var(--bg-surface)]'
									}`}
								>
									<p className="text-[11px] text-[var(--text-main)]">{scheme.badge}</p>
									<p className="text-[9px] text-[var(--text-muted)] truncate">{scheme.name}</p>
								</button>
							))}
						</div>
					</div>

					{/* Typography Style Picker */}
					<div>
						<p className="font-semibold text-[var(--text-muted)] mb-2">Typography Theme</p>
						<div className="grid grid-cols-2 gap-1.5">
							{Object.values(THEME_STYLES).map((st) => (
								<button
									key={st.id}
									onClick={() => selectStyle(st.id)}
									className={`p-2 rounded-lg border text-left transition-all ${
										styleId === st.id
											? 'border-[var(--accent)] bg-[var(--accent)]/10 font-bold'
											: 'border-[var(--border)] bg-[var(--bg-sidebar)] hover:bg-[var(--bg-surface)]'
									}`}
								>
									<p className="text-[11px] text-[var(--text-main)]">{st.name}</p>
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
