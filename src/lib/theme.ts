import {
	COLOR_SCHEMES,
	THEME_STYLES,
	LAYOUT_SCHEMES,
	FONT_SIZES,
	PRESET_THEMES,
} from './theme-data.mjs';
import config from 'virtual:hakushi/config';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorSchemeId = keyof typeof COLOR_SCHEMES;
export type ThemeStyleId = keyof typeof THEME_STYLES;
export type LayoutSchemeId = keyof typeof LAYOUT_SCHEMES;
export type FontSizeId = keyof typeof FONT_SIZES;
export type PresetThemeId = keyof typeof PRESET_THEMES;

export { COLOR_SCHEMES, THEME_STYLES, LAYOUT_SCHEMES, FONT_SIZES, PRESET_THEMES };

export function resolveIsDark(mode: ThemeMode, prefersDark: boolean): boolean {
	return mode === 'dark' || (mode === 'auto' && prefersDark);
}

/**
 * Applies color scheme, typography style, layout geometry, and font size scale
 * to document root as CSS custom properties and classes.
 */
export function applyTheme(
	mode: ThemeMode,
	schemeId: ColorSchemeId,
	styleId: ThemeStyleId,
	layoutId: LayoutSchemeId = 'comfortable',
	fontSizeId: FontSizeId = 'md',
	presetId?: PresetThemeId
) {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;

	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const isDark = resolveIsDark(mode, prefersDark);

	if (isDark) {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}

	// 1. Color Palette
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

	// 2. Typography Fonts & Radius
	const style = THEME_STYLES[styleId] ?? THEME_STYLES.sans;
	root.style.setProperty('--font-heading', style.fontHeading);
	root.style.setProperty('--font-body', style.fontBody);
	root.style.setProperty('--font-code', style.fontCode);
	root.style.setProperty('--radius', style.radius);

	// 3. Layout Dimensions & Rhythm
	const layout = LAYOUT_SCHEMES[layoutId] ?? LAYOUT_SCHEMES.comfortable;
	root.style.setProperty('--shell-max-width', layout.shellMaxWidth);
	root.style.setProperty('--content-max-width', layout.contentMaxWidth);
	root.style.setProperty('--content-padding-x', layout.contentPaddingX);
	root.style.setProperty('--content-padding-y', layout.contentPaddingY);
	root.style.setProperty('--line-height-body', layout.lineHeightBody);
	root.style.setProperty('--line-height-heading', layout.lineHeightHeading);
	root.style.setProperty('--spacing-paragraph', layout.spacingParagraph);
	root.style.setProperty('--card-padding', layout.cardPadding);
	root.dataset.layout = layoutId;

	// 4. Font Size Scale - sets root font-size directly to guarantee instant rem-scaling
	const font = FONT_SIZES[fontSizeId] ?? FONT_SIZES.md;
	root.style.fontSize = font.rootSize;
	root.style.setProperty('--font-size-base', font.fontSizeBase);
	root.style.setProperty('--font-size-h1', font.fontSizeH1);
	root.style.setProperty('--font-size-h2', font.fontSizeH2);
	root.style.setProperty('--font-size-h3', font.fontSizeH3);
	root.dataset.fontSize = fontSizeId;

	// 5. Preset Identifier
	if (presetId) {
		root.dataset.preset = presetId;
	} else {
		delete root.dataset.preset;
	}
}

export function readStoredTheme(): {
	mode: ThemeMode;
	schemeId: ColorSchemeId;
	styleId: ThemeStyleId;
	layoutId: LayoutSchemeId;
	fontSizeId: FontSizeId;
	presetId?: PresetThemeId;
} {
	const themeCfg = config.theme as any;
	let mode: ThemeMode = themeCfg.mode ?? 'dark';
	let schemeId: ColorSchemeId = (themeCfg.colorScheme as ColorSchemeId) ?? 'hakushi';
	let styleId: ThemeStyleId = (themeCfg.style as ThemeStyleId) ?? 'sans';
	let layoutId: LayoutSchemeId = (themeCfg.layout as LayoutSchemeId) ?? 'comfortable';
	let fontSizeId: FontSizeId = (themeCfg.fontSize as FontSizeId) ?? 'md';
	let presetId: PresetThemeId | undefined = (themeCfg.preset as PresetThemeId) || undefined;

	try {
		mode = (localStorage.getItem('hakushi_mode') as ThemeMode) || mode;
		schemeId = (localStorage.getItem('hakushi_scheme') as ColorSchemeId) || schemeId;
		styleId = (localStorage.getItem('hakushi_style') as ThemeStyleId) || styleId;
		layoutId = (localStorage.getItem('hakushi_layout') as LayoutSchemeId) || layoutId;
		fontSizeId = (localStorage.getItem('hakushi_font_size') as FontSizeId) || fontSizeId;
		presetId = (localStorage.getItem('hakushi_preset') as PresetThemeId) || presetId;
	} catch {
		/* ignore */
	}
	return { mode, schemeId, styleId, layoutId, fontSizeId, presetId };
}
