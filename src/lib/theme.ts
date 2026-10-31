import config from 'virtual:hakushi/config';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorSchemeId = string;
export type ThemeStyleId = string;
export type LayoutSchemeId = string;
export type FontSizeId = string;
export type PresetThemeId = string;

export interface ThemeColors {
	primary: string;
	primaryHover: string;
	accent: string;
	secondary: string;
	bgMain: string;
	bgSurface: string;
	bgSidebar: string;
	border: string;
	textMain: string;
	textMuted: string;
}
export interface ColorScheme {
	id: string;
	name: string;
	description?: string;
	badge?: string;
	colors: ThemeColors;
	darkColors: ThemeColors;
}
export interface ThemeStyle {
	id: string;
	name: string;
	description?: string;
	fontHeading: string;
	fontBody: string;
	fontCode: string;
	radius: string;
	stylesheet?: string | string[];
}
export interface LayoutScheme {
	id: string;
	name: string;
	description?: string;
	badge?: string;
	shellMaxWidth: string;
	contentMaxWidth: string;
	contentPaddingX: string;
	contentPaddingY: string;
	lineHeightBody: string;
	lineHeightHeading: string;
	spacingParagraph: string;
	cardPadding: string;
}
export interface FontSize {
	id: string;
	name: string;
	label: string;
	badge?: string;
	rootSize: string;
	fontSizeBase: string;
	fontSizeH1: string;
	fontSizeH2: string;
	fontSizeH3: string;
}
export interface PresetTheme {
	id: string;
	name: string;
	badge?: string;
	tagline?: string;
	description?: string;
	colorScheme: ColorSchemeId;
	style: ThemeStyleId;
	layout: LayoutSchemeId;
	fontSize: FontSizeId;
}

/**
 * Resolved catalogs: built-ins merged with the site's `theme` configuration
 * (see src/lib/theme-catalog.mjs), in picker order.
 */
export const COLOR_SCHEMES = config.theme.colorSchemes as Record<ColorSchemeId, ColorScheme>;
export const THEME_STYLES = config.theme.styles as Record<ThemeStyleId, ThemeStyle>;
export const LAYOUT_SCHEMES = config.theme.layouts as Record<LayoutSchemeId, LayoutScheme>;
export const FONT_SIZES = config.theme.fontSizes as Record<FontSizeId, FontSize>;
export const PRESET_THEMES = config.theme.presets as Record<PresetThemeId, PresetTheme>;

/** The site's configured default appearance. */
export const THEME_DEFAULTS = {
	mode: config.theme.mode as ThemeMode,
	schemeId: config.theme.colorScheme as ColorSchemeId,
	styleId: config.theme.style as ThemeStyleId,
	layoutId: config.theme.layout as LayoutSchemeId,
	fontSizeId: config.theme.fontSize as FontSizeId,
	presetId: (config.theme.preset || undefined) as PresetThemeId | undefined,
};

const has = (table: object, id: string | null | undefined): id is string =>
	!!id && Object.prototype.hasOwnProperty.call(table, id);

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
	layoutId: LayoutSchemeId = THEME_DEFAULTS.layoutId,
	fontSizeId: FontSizeId = THEME_DEFAULTS.fontSizeId,
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
	if (!has(COLOR_SCHEMES, schemeId)) schemeId = THEME_DEFAULTS.schemeId;
	const scheme = COLOR_SCHEMES[schemeId];
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
	root.dataset.scheme = schemeId;

	// 2. Typography Fonts & Radius
	if (!has(THEME_STYLES, styleId)) styleId = THEME_DEFAULTS.styleId;
	const style = THEME_STYLES[styleId];
	root.style.setProperty('--font-heading', style.fontHeading);
	root.style.setProperty('--font-body', style.fontBody);
	root.style.setProperty('--font-code', style.fontCode);
	root.style.setProperty('--radius', style.radius);
	root.dataset.style = styleId;

	// 3. Layout Dimensions & Rhythm
	if (!has(LAYOUT_SCHEMES, layoutId)) layoutId = THEME_DEFAULTS.layoutId;
	const layout = LAYOUT_SCHEMES[layoutId];
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
	if (!has(FONT_SIZES, fontSizeId)) fontSizeId = THEME_DEFAULTS.fontSizeId;
	const font = FONT_SIZES[fontSizeId];
	root.style.fontSize = font.rootSize;
	root.style.setProperty('--font-size-base', font.fontSizeBase);
	root.style.setProperty('--font-size-h1', font.fontSizeH1);
	root.style.setProperty('--font-size-h2', font.fontSizeH2);
	root.style.setProperty('--font-size-h3', font.fontSizeH3);
	root.dataset.fontSize = fontSizeId;

	// 5. Preset Identifier
	if (has(PRESET_THEMES, presetId)) {
		root.dataset.preset = presetId;
	} else {
		delete root.dataset.preset;
	}
}

/**
 * Reads the saved appearance, falling back to the configured defaults for
 * anything unset or no longer configured (e.g. a removed custom scheme).
 */
export function readStoredTheme(): {
	mode: ThemeMode;
	schemeId: ColorSchemeId;
	styleId: ThemeStyleId;
	layoutId: LayoutSchemeId;
	fontSizeId: FontSizeId;
	presetId?: PresetThemeId;
} {
	const result = { ...THEME_DEFAULTS };
	try {
		const read = (key: string, table: object, fallback: string) => {
			const id = localStorage.getItem(key);
			return has(table, id) ? id : fallback;
		};
		const mode = localStorage.getItem('hakushi_mode');
		if (mode === 'light' || mode === 'dark' || mode === 'auto') result.mode = mode;
		result.schemeId = read('hakushi_scheme', COLOR_SCHEMES, result.schemeId);
		result.styleId = read('hakushi_style', THEME_STYLES, result.styleId);
		result.layoutId = read('hakushi_layout', LAYOUT_SCHEMES, result.layoutId);
		result.fontSizeId = read('hakushi_font_size', FONT_SIZES, result.fontSizeId);
		const preset = localStorage.getItem('hakushi_preset');
		if (preset !== null) result.presetId = has(PRESET_THEMES, preset) ? preset : undefined;
	} catch {
		/* ignore */
	}
	return result;
}

/** localStorage keys holding the reader's appearance choices. */
export const THEME_STORAGE_KEYS = [
	'hakushi_mode',
	'hakushi_scheme',
	'hakushi_style',
	'hakushi_layout',
	'hakushi_font_size',
	'hakushi_preset',
];
