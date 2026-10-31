import { COLOR_SCHEMES, THEME_STYLES, LAYOUT_SCHEMES, FONT_SIZES, PRESET_THEMES } from './theme-data.mjs';

/**
 * Inline script embedded in every page <head> before paint. Applies the saved
 * appearance (mode / color scheme / typography / layout / font size) from
 * localStorage so there is no flash of the wrong theme. Mirrors applyTheme().
 *
 * `theme` is the resolved `config.theme` (see resolveTheme()), carrying the
 * default selection and the merged catalogs, custom entries included. A stored
 * id that is no longer configured falls back to the configured default.
 */
export function createThemeInitScript(theme = {}) {
	const SCHEMES = theme.colorSchemes ?? COLOR_SCHEMES;
	const STYLES = theme.styles ?? THEME_STYLES;
	const LAYOUTS = theme.layouts ?? LAYOUT_SCHEMES;
	const FONTS = theme.fontSizes ?? FONT_SIZES;
	const PRESETS = theme.presets ?? PRESET_THEMES;
	const defaults = {
		mode: theme.mode ?? 'dark',
		scheme: theme.colorScheme ?? 'hakushi',
		style: theme.style ?? 'sans',
		layout: theme.layout ?? 'comfortable',
		fontSize: theme.fontSize ?? 'md',
		preset: theme.preset ?? '',
	};

	return `
(function () {
  var SCHEMES = ${JSON.stringify(SCHEMES)};
  var STYLES = ${JSON.stringify(STYLES)};
  var LAYOUTS = ${JSON.stringify(LAYOUTS)};
  var FONTS = ${JSON.stringify(FONTS)};
  var PRESET_IDS = ${JSON.stringify(Object.keys(PRESETS))};
  var D = ${JSON.stringify(defaults)};
  function stored(key, table, fallback) {
    var id = localStorage.getItem(key);
    return id && (!table || Object.prototype.hasOwnProperty.call(table, id)) ? id : fallback;
  }
  try {
    var mode = localStorage.getItem('hakushi_mode') || D.mode;
    var schemeId = stored('hakushi_scheme', SCHEMES, D.scheme);
    var styleId = stored('hakushi_style', STYLES, D.style);
    var layoutId = stored('hakushi_layout', LAYOUTS, D.layout);
    var fontSizeId = stored('hakushi_font_size', FONTS, D.fontSize);
    var presetId = localStorage.getItem('hakushi_preset');
    if (presetId === null) presetId = D.preset;
    else if (PRESET_IDS.indexOf(presetId) === -1) presetId = '';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = mode === 'dark' || (mode === 'auto' && prefersDark);
    var root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    var s = SCHEMES[schemeId];
    var c = isDark ? s.darkColors : s.colors;
    var vars = {
      primary: c.primary,
      'primary-hover': c.primaryHover,
      accent: c.accent,
      secondary: c.secondary,
      'bg-main': c.bgMain,
      'bg-surface': c.bgSurface,
      'bg-sidebar': c.bgSidebar,
      border: c.border,
      'text-main': c.textMain,
      'text-muted': c.textMuted
    };
    for (var k in vars) root.style.setProperty('--' + k, vars[k]);
    var st = STYLES[styleId];
    root.style.setProperty('--font-heading', st.fontHeading);
    root.style.setProperty('--font-body', st.fontBody);
    root.style.setProperty('--font-code', st.fontCode);
    root.style.setProperty('--radius', st.radius);
    root.dataset.style = styleId;

    var lay = LAYOUTS[layoutId];
    root.style.setProperty('--shell-max-width', lay.shellMaxWidth);
    root.style.setProperty('--content-max-width', lay.contentMaxWidth);
    root.style.setProperty('--content-padding-x', lay.contentPaddingX);
    root.style.setProperty('--content-padding-y', lay.contentPaddingY);
    root.style.setProperty('--line-height-body', lay.lineHeightBody);
    root.style.setProperty('--line-height-heading', lay.lineHeightHeading);
    root.style.setProperty('--spacing-paragraph', lay.spacingParagraph);
    root.style.setProperty('--card-padding', lay.cardPadding);
    root.dataset.layout = layoutId;

    var fn = FONTS[fontSizeId];
    root.style.fontSize = fn.rootSize;
    root.style.setProperty('--font-size-base', fn.fontSizeBase);
    root.style.setProperty('--font-size-h1', fn.fontSizeH1);
    root.style.setProperty('--font-size-h2', fn.fontSizeH2);
    root.style.setProperty('--font-size-h3', fn.fontSizeH3);
    root.dataset.fontSize = fontSizeId;

    root.dataset.scheme = schemeId;
    if (presetId) root.dataset.preset = presetId;
  } catch (e) {}
})();
`;
}
