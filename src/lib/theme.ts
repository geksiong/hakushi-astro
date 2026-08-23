import { COLOR_SCHEMES, THEME_STYLES } from './theme-data.mjs';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorSchemeId = keyof typeof COLOR_SCHEMES;
export type ThemeStyleId = keyof typeof THEME_STYLES;

export { COLOR_SCHEMES, THEME_STYLES };

export function resolveIsDark(mode: ThemeMode, prefersDark: boolean): boolean {
	return mode === 'dark' || (mode === 'auto' && prefersDark);
}

/** Ported applyTheme() from the reference project. */
export function applyTheme(mode: ThemeMode, schemeId: ColorSchemeId, styleId: ThemeStyleId) {
	const root = document.documentElement;

	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const isDark = resolveIsDark(mode, prefersDark);

	if (isDark) {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}

	const scheme = COLOR_SCHEMES[schemeId] ?? COLOR_SCHEMES.hakushi;
	const activeColors = isDark ? scheme.darkColors : scheme.colors;

	root.style.setProperty('--primary', activeColors.primary);
	root.style.setProperty('--primary-hover', activeColors.primaryHover);
	root.style.setProperty('--accent', activeColors.accent);
	root.style.setProperty('--secondary', activeColors.secondary);
	root.style.setProperty('--bg-main', activeColors.bgMain);
	root.style.setProperty('--bg-surface', activeColors.bgSurface);
	root.style.setProperty('--bg-sidebar', activeColors.bgSidebar);
	root.style.setProperty('--border', activeColors.border);
	root.style.setProperty('--text-main', activeColors.textMain);
	root.style.setProperty('--text-muted', activeColors.textMuted);

	const style = THEME_STYLES[styleId] ?? THEME_STYLES.sans;
	root.style.setProperty('--font-heading', style.fontHeading);
	root.style.setProperty('--font-body', style.fontBody);
	root.style.setProperty('--font-code', style.fontCode);
	root.style.setProperty('--radius', style.radius);
}

export function readStoredTheme(): {
	mode: ThemeMode;
	schemeId: ColorSchemeId;
	styleId: ThemeStyleId;
} {
	let mode: ThemeMode = 'dark';
	let schemeId: ColorSchemeId = 'hakushi';
	let styleId: ThemeStyleId = 'sans';
	try {
		mode = (localStorage.getItem('hakushi_mode') as ThemeMode) || 'dark';
		schemeId = (localStorage.getItem('hakushi_scheme') as ColorSchemeId) || 'hakushi';
		styleId = (localStorage.getItem('hakushi_style') as ThemeStyleId) || 'sans';
	} catch {
		/* ignore */
	}
	return { mode, schemeId, styleId };
}
