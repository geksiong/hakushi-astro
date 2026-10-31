import { useEffect, useRef, useState } from 'react';
import {
	Sun,
	Moon,
	Monitor,
	SlidersHorizontal,
	Palette as PaletteIcon,
	X,
	Sparkles,
	Check,
	BookOpen,
	Maximize2,
	Minimize2,
	RotateCcw,
	ChevronDown,
	ChevronUp,
	LayoutTemplate,
	type LucideIcon,
} from 'lucide-react';
import {
	COLOR_SCHEMES,
	THEME_STYLES,
	LAYOUT_SCHEMES,
	FONT_SIZES,
	PRESET_THEMES,
	THEME_DEFAULTS,
	THEME_STORAGE_KEYS,
	applyTheme,
	readStoredTheme,
	resolveIsDark,
	type ThemeMode,
	type ColorSchemeId,
	type ThemeStyleId,
	type LayoutSchemeId,
	type FontSizeId,
	type PresetThemeId,
} from '../lib/theme';

const MODE_ICONS: Record<ThemeMode, LucideIcon> = {
	light: Sun,
	dark: Moon,
	auto: Monitor,
};

/** Icons for the built-in layouts; custom layouts use LayoutTemplate. */
const LAYOUT_ICONS: Record<string, LucideIcon> = {
	compact: Minimize2,
	comfortable: BookOpen,
	spacious: Maximize2,
};

export default function ThemeMenu() {
	const [showMenu, setShowMenu] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const initial = readStoredTheme();
	const [mode, setMode] = useState<ThemeMode>(initial.mode);
	const [schemeId, setSchemeId] = useState<ColorSchemeId>(initial.schemeId);
	const [styleId, setStyleId] = useState<ThemeStyleId>(initial.styleId);
	const [layoutId, setLayoutId] = useState<LayoutSchemeId>(initial.layoutId);
	const [fontSizeId, setFontSizeId] = useState<FontSizeId>(initial.fontSizeId);
	const [activePreset, setActivePreset] = useState<PresetThemeId | undefined>(initial.presetId);

	// Detect if current system prefers dark mode for previewing swatches
	const [isDarkEffective, setIsDarkEffective] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		setIsDarkEffective(resolveIsDark(mode, mql.matches));
		const handler = (e: MediaQueryListEvent) => {
			setIsDarkEffective(resolveIsDark(mode, e.matches));
		};
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	}, [mode]);

	const selectMode = (m: ThemeMode) => {
		setMode(m);
		try {
			localStorage.setItem('hakushi_mode', m);
		} catch {}
		applyTheme(m, schemeId, styleId, layoutId, fontSizeId, activePreset);
	};

	const selectPreset = (presetKey: PresetThemeId) => {
		const preset = PRESET_THEMES[presetKey];
		if (!preset) return;

		setActivePreset(presetKey);
		setSchemeId(preset.colorScheme as ColorSchemeId);
		setStyleId(preset.style as ThemeStyleId);
		setLayoutId(preset.layout as LayoutSchemeId);
		if (preset.fontSize) {
			setFontSizeId(preset.fontSize as FontSizeId);
		}

		try {
			localStorage.setItem('hakushi_preset', presetKey);
			localStorage.setItem('hakushi_scheme', preset.colorScheme);
			localStorage.setItem('hakushi_style', preset.style);
			localStorage.setItem('hakushi_layout', preset.layout);
			if (preset.fontSize) {
				localStorage.setItem('hakushi_font_size', preset.fontSize);
			}
		} catch {}

		applyTheme(
			mode,
			preset.colorScheme as ColorSchemeId,
			preset.style as ThemeStyleId,
			preset.layout as LayoutSchemeId,
			(preset.fontSize as FontSizeId) ?? fontSizeId,
			presetKey
		);
	};

	const selectLayout = (id: LayoutSchemeId) => {
		setLayoutId(id);
		// If layout changes independently, clear or keep active preset
		try {
			localStorage.setItem('hakushi_layout', id);
		} catch {}
		applyTheme(mode, schemeId, styleId, id, fontSizeId, activePreset);
	};

	const selectFontSize = (id: FontSizeId) => {
		setFontSizeId(id);
		try {
			localStorage.setItem('hakushi_font_size', id);
		} catch {}
		applyTheme(mode, schemeId, styleId, layoutId, id, activePreset);
	};

	const selectScheme = (id: ColorSchemeId) => {
		setSchemeId(id);
		setActivePreset(undefined);
		try {
			localStorage.setItem('hakushi_scheme', id);
			localStorage.setItem('hakushi_preset', '');
		} catch {}
		applyTheme(mode, id, styleId, layoutId, fontSizeId, undefined);
	};

	const selectStyle = (id: ThemeStyleId) => {
		setStyleId(id);
		setActivePreset(undefined);
		try {
			localStorage.setItem('hakushi_style', id);
			localStorage.setItem('hakushi_preset', '');
		} catch {}
		applyTheme(mode, schemeId, id, layoutId, fontSizeId, undefined);
	};

	// Back to the site's configured defaults (including custom ones).
	const handleReset = () => {
		const d = THEME_DEFAULTS;
		setMode(d.mode);
		setSchemeId(d.schemeId);
		setStyleId(d.styleId);
		setLayoutId(d.layoutId);
		setFontSizeId(d.fontSizeId);
		setActivePreset(d.presetId);
		try {
			for (const key of THEME_STORAGE_KEYS) localStorage.removeItem(key);
		} catch {}
		applyTheme(d.mode, d.schemeId, d.styleId, d.layoutId, d.fontSizeId, d.presetId);
	};

	useEffect(() => {
		if (!showMenu) return;
		const onDown = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setShowMenu(false);
			}
		};
		document.addEventListener('mousedown', onDown);
		return () => document.removeEventListener('mousedown', onDown);
	}, [showMenu]);

	return (
		<div className="relative" ref={menuRef}>
			<button
				onClick={() => setShowMenu(!showMenu)}
				title="Customize Themes, Layout & Typography"
				aria-label="Theme Customizer"
				aria-expanded={showMenu}
				className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors"
			>
				<PaletteIcon className="w-4 h-4" />
			</button>

			{showMenu && (
				<div className="absolute right-0 top-full mt-2 w-[min(26rem,calc(100vw_-_1.5rem))] max-h-[min(40rem,calc(100vh_-_4.5rem))] overflow-y-auto p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl z-50 space-y-4 text-xs animate-in fade-in slide-in-from-top-2">
					{/* Modal Header */}
					<div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)]">
						<div className="flex items-center gap-2 font-bold text-[var(--text-main)]">
							<SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" />
							<span className="text-sm font-semibold tracking-tight">Theme Customizer</span>
						</div>
						<div className="flex items-center gap-1">
							<button
								onClick={handleReset}
								title="Reset to default theme"
								aria-label="Reset to default"
								className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors flex items-center gap-1 text-[11px]"
							>
								<RotateCcw className="w-3 h-3" />
								<span>Reset</span>
							</button>
							<button
								onClick={() => setShowMenu(false)}
								aria-label="Close"
								className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>

					{/* 1. Appearance Mode */}
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<span className="font-semibold text-[var(--text-muted)] text-[11px] uppercase tracking-wider">
								Appearance
							</span>
							<span className="text-[10px] text-[var(--text-muted)]">
								{isDarkEffective ? 'Dark Mode Active' : 'Light Mode Active'}
							</span>
						</div>
						<div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-sidebar)]/80 rounded-lg border border-[var(--border)]/70">
							{(['light', 'dark', 'auto'] as const).map((m) => {
								const Icon = MODE_ICONS[m];
								const isSelected = mode === m;
								return (
									<button
										key={m}
										type="button"
										onClick={() => selectMode(m)}
										className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] capitalize font-medium transition-all ${
											isSelected
												? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm font-semibold'
												: 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
										}`}
									>
										<Icon className="w-3.5 h-3.5" />
										{m}
									</button>
								);
							})}
						</div>
					</div>

					{/* 2. Font Size Customisation (Interactive Stepper) */}
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<span className="font-semibold text-[var(--text-muted)] text-[11px] uppercase tracking-wider">
								Font Size
							</span>
							<span className="text-[10px] text-[var(--primary)] font-medium">
								{FONT_SIZES[fontSizeId].name}
								{FONT_SIZES[fontSizeId].badge && ` · ${FONT_SIZES[fontSizeId].badge}`}
							</span>
						</div>
						<div className="grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-1 p-1 bg-[var(--bg-sidebar)]/80 rounded-lg border border-[var(--border)]/70">
							{(Object.keys(FONT_SIZES) as FontSizeId[]).map((fid) => {
								const font = FONT_SIZES[fid];
								const isSelected = fontSizeId === fid;
								return (
									<button
										key={fid}
										type="button"
										onClick={() => selectFontSize(fid)}
										className={`flex flex-col items-center justify-center py-2 rounded-md transition-all ${
											isSelected
												? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm font-bold border border-[var(--primary)]/40 ring-1 ring-[var(--primary)]/20'
												: 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]/50'
										}`}
									>
										<span className="font-extrabold text-sm leading-none mb-0.5">
											{font.label}
										</span>
										<span className="text-[10px] opacity-80">
											{font.badge}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* 3. Layout Options (Compact, Comfortable, Spacious) */}
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<span className="font-semibold text-[var(--text-muted)] text-[11px] uppercase tracking-wider">
								Layout Spacing
							</span>
							<span className="text-[10px] text-[var(--primary)] font-medium">
								{LAYOUT_SCHEMES[layoutId].name}
							</span>
						</div>
						<div className="grid grid-cols-3 gap-1.5">
							{(Object.keys(LAYOUT_SCHEMES) as LayoutSchemeId[]).map((lid) => {
								const lay = LAYOUT_SCHEMES[lid];
								const Icon = LAYOUT_ICONS[lid] ?? LayoutTemplate;
								const isSelected = layoutId === lid;
								return (
									<button
										key={lid}
										type="button"
										onClick={() => selectLayout(lid)}
										className={`p-2.5 rounded-lg border text-left transition-all ${
											isSelected
												? 'border-[var(--primary)] bg-[var(--primary)]/[0.08] shadow-xs ring-1 ring-[var(--primary)]/20'
												: 'border-[var(--border)] hover:border-[var(--text-muted)]/40 bg-[var(--bg-sidebar)]/30 hover:bg-[var(--bg-sidebar)]/60'
										}`}
									>
										<div className="flex items-center gap-1.5 font-semibold text-[11px] text-[var(--text-main)] mb-1">
											<Icon className="w-3.5 h-3.5 text-[var(--primary)]" />
											{lay.name}
										</div>
										<p className="text-[9px] text-[var(--text-muted)] leading-tight">
											{lay.badge ? `${lay.badge} · ${lay.contentMaxWidth}` : lay.contentMaxWidth}
										</p>
									</button>
								);
							})}
						</div>
					</div>

					{/* 4. Curated Preset Themes */}
					{Object.keys(PRESET_THEMES).length > 0 && (
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<span className="font-semibold text-[var(--text-muted)] text-[11px] uppercase tracking-wider flex items-center gap-1">
								<Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
								Preset Themes
							</span>
							<span className="text-[10px] text-[var(--text-muted)]">
								Color + Typography + Layout
							</span>
						</div>

						<div className="space-y-1.5">
							{(Object.keys(PRESET_THEMES) as PresetThemeId[]).map((key) => {
								const preset = PRESET_THEMES[key];
								const scheme = COLOR_SCHEMES[preset.colorScheme as ColorSchemeId];
								const isSelected = activePreset
									? activePreset === key
									: schemeId === preset.colorScheme &&
										styleId === preset.style &&
										layoutId === preset.layout;
								const activePalette = isDarkEffective ? scheme.darkColors : scheme.colors;

								return (
									<button
										key={key}
										type="button"
										onClick={() => selectPreset(key)}
										className={`w-full text-left p-2.5 rounded-lg border transition-all relative overflow-hidden group ${
											isSelected
												? 'border-[var(--primary)] bg-[var(--primary)]/[0.08] shadow-xs ring-1 ring-[var(--primary)]/30'
												: 'border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--bg-sidebar)]/20 hover:bg-[var(--bg-sidebar)]/60'
										}`}
									>
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2 min-w-0">
												<span className="font-semibold text-xs text-[var(--text-main)] truncate">
													{preset.name}
												</span>
												{preset.tagline && (
													<span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] shrink-0">
														{preset.tagline}
													</span>
												)}
											</div>

											<div className="flex items-center gap-2 shrink-0">
												{/* Live 3-Swatch Color Preview */}
												<div
													className="flex items-center -space-x-1 p-0.5 rounded-full border border-[var(--border)]"
													title={`Bg: ${activePalette.bgMain}, Primary: ${activePalette.primary}`}
												>
													<span
														className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shrink-0 shadow-2xs"
														style={{ backgroundColor: activePalette.bgMain }}
													/>
													<span
														className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shrink-0 shadow-2xs"
														style={{ backgroundColor: activePalette.primary }}
													/>
													<span
														className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shrink-0 shadow-2xs"
														style={{ backgroundColor: activePalette.accent }}
													/>
												</div>

												{isSelected && (
													<Check className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
												)}
											</div>
										</div>

										{preset.description && (
											<p className="text-[10px] text-[var(--text-muted)] mt-1 leading-snug">
												{preset.description}
											</p>
										)}

										<div className="flex items-center gap-2 mt-1.5 text-[9px] text-[var(--text-muted)] opacity-80">
											<span>{THEME_STYLES[preset.style]?.name ?? preset.style}</span>
											<span>•</span>
											<span>{LAYOUT_SCHEMES[preset.layout]?.name ?? preset.layout} Layout</span>
										</div>
									</button>
								);
							})}
						</div>
					</div>
					)}

					{/* 5. Collapsible Fine-Tuning (Independent Colors & Typography) */}
					<div className="pt-1 border-t border-[var(--border)]">
						<button
							type="button"
							onClick={() => setShowAdvanced(!showAdvanced)}
							className="w-full flex items-center justify-between py-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
						>
							<span>Fine-Tune Palette & Typography</span>
							{showAdvanced ? (
								<ChevronUp className="w-3.5 h-3.5" />
							) : (
								<ChevronDown className="w-3.5 h-3.5" />
							)}
						</button>

						{showAdvanced && (
							<div className="space-y-3 pt-2">
								{/* Color Schemes */}
								<div>
									<p className="font-semibold text-[var(--text-muted)] text-[10px] uppercase tracking-wider mb-1.5">
										Color Palettes ({Object.keys(COLOR_SCHEMES).length})
									</p>
									<div className="grid grid-cols-2 gap-1.5">
										{Object.values(COLOR_SCHEMES).map((scheme) => {
											const isSelected = schemeId === scheme.id;
											const activePalette = isDarkEffective ? scheme.darkColors : scheme.colors;
											return (
												<button
													key={scheme.id}
													type="button"
													onClick={() => selectScheme(scheme.id as ColorSchemeId)}
													className={`p-2 rounded-lg border text-left transition-all flex items-center justify-between ${
														isSelected
															? 'border-[var(--primary)] bg-[var(--primary)]/[0.08] font-medium shadow-xs'
															: 'border-[var(--border)] hover:border-[var(--text-muted)]/40 bg-[var(--bg-sidebar)]/20'
													}`}
												>
													<div className="min-w-0 pr-1">
														<p className="text-[11px] font-medium text-[var(--text-main)] truncate">
															{scheme.badge ?? scheme.name}
														</p>
														<p className="text-[9px] text-[var(--text-muted)] truncate">
															{scheme.badge ? scheme.name : scheme.description}
														</p>
													</div>

													<div className="flex items-center -space-x-1 shrink-0">
														<span
															className="w-3 h-3 rounded-full border border-black/10 inline-block shadow-2xs"
															style={{ backgroundColor: activePalette.bgMain }}
														/>
														<span
															className="w-3 h-3 rounded-full border border-black/10 inline-block shadow-2xs"
															style={{ backgroundColor: activePalette.primary }}
														/>
														<span
															className="w-3 h-3 rounded-full border border-black/10 inline-block shadow-2xs"
															style={{ backgroundColor: activePalette.accent }}
														/>
													</div>
												</button>
											);
										})}
									</div>
								</div>

								{/* Typography Theme */}
								<div>
									<p className="font-semibold text-[var(--text-muted)] text-[10px] uppercase tracking-wider mb-1.5">
										Typography Family
									</p>
									<div className="grid grid-cols-2 gap-1.5">
										{Object.values(THEME_STYLES).map((st) => {
											const isSelected = styleId === st.id;
											return (
												<button
													key={st.id}
													type="button"
													onClick={() => selectStyle(st.id as ThemeStyleId)}
													className={`p-2 rounded-lg border text-left transition-all ${
														isSelected
															? 'border-[var(--accent)] bg-[var(--accent)]/[0.08] font-medium shadow-xs'
															: 'border-[var(--border)] hover:border-[var(--text-muted)]/40 bg-[var(--bg-sidebar)]/20'
													}`}
												>
													<p className="text-[11px] text-[var(--text-main)] font-semibold" style={{ fontFamily: st.fontHeading }}>
														{st.name}
													</p>
													{st.description && (
														<p className="text-[9px] text-[var(--text-muted)] truncate mt-0.5">
															{st.description}
														</p>
													)}
												</button>
											);
										})}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
