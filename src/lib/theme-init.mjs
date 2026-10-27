import { COLOR_SCHEMES, THEME_STYLES, LAYOUT_SCHEMES, FONT_SIZES, PRESET_THEMES } from './theme-data.mjs';

/**
 * Inline script embedded in every page <head> before paint. Applies the saved
 * appearance (mode / color scheme / typography / layout / font size) from
 * localStorage so there is no flash of the wrong theme. Mirrors applyTheme().
 */
export function createThemeInitScript(defaults = {}) {
	const mode = defaults.mode ?? 'dark';
	const colorScheme = defaults.colorScheme ?? 'hakushi';
	const style = defaults.style ?? 'sans';
	const layout = defaults.layout ?? 'comfortable';
	const fontSize = defaults.fontSize ?? 'md';
	const preset = defaults.preset ?? 'hakushi';

	return `
(function () {
  var SCHEMES = ${JSON.stringify(COLOR_SCHEMES)};
  var STYLES = ${JSON.stringify(THEME_STYLES)};
  var LAYOUTS = ${JSON.stringify(LAYOUT_SCHEMES)};
  var FONTS = ${JSON.stringify(FONT_SIZES)};
  try {
    var mode = localStorage.getItem('hakushi_mode') || ${JSON.stringify(mode)};
    var schemeId = localStorage.getItem('hakushi_scheme') || ${JSON.stringify(colorScheme)};
    var styleId = localStorage.getItem('hakushi_style') || ${JSON.stringify(style)};
    var layoutId = localStorage.getItem('hakushi_layout') || ${JSON.stringify(layout)};
    var fontSizeId = localStorage.getItem('hakushi_font_size') || ${JSON.stringify(fontSize)};
    var presetId = localStorage.getItem('hakushi_preset') || ${JSON.stringify(preset)};
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = mode === 'dark' || (mode === 'auto' && prefersDark);
    var root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    var s = SCHEMES[schemeId] || SCHEMES.hakushi;
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
    var st = STYLES[styleId] || STYLES.sans;
    root.style.setProperty('--font-heading', st.fontHeading);
    root.style.setProperty('--font-body', st.fontBody);
    root.style.setProperty('--font-code', st.fontCode);
    root.style.setProperty('--radius', st.radius);

    var lay = LAYOUTS[layoutId] || LAYOUTS.comfortable;
    root.style.setProperty('--shell-max-width', lay.shellMaxWidth);
    root.style.setProperty('--content-max-width', lay.contentMaxWidth);
    root.style.setProperty('--content-padding-x', lay.contentPaddingX);
    root.style.setProperty('--content-padding-y', lay.contentPaddingY);
    root.style.setProperty('--line-height-body', lay.lineHeightBody);
    root.style.setProperty('--line-height-heading', lay.lineHeightHeading);
    root.style.setProperty('--spacing-paragraph', lay.spacingParagraph);
    root.style.setProperty('--card-padding', lay.cardPadding);
    root.dataset.layout = layoutId;

    var fn = FONTS[fontSizeId] || FONTS.md;
    root.style.fontSize = fn.rootSize;
    root.style.setProperty('--font-size-base', fn.fontSizeBase);
    root.style.setProperty('--font-size-h1', fn.fontSizeH1);
    root.style.setProperty('--font-size-h2', fn.fontSizeH2);
    root.style.setProperty('--font-size-h3', fn.fontSizeH3);
    root.dataset.fontSize = fontSizeId;

    if (presetId) root.dataset.preset = presetId;
  } catch (e) {}
})();
`;
}
