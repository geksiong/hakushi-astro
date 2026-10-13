import { COLOR_SCHEMES, THEME_STYLES } from './theme-data.mjs';

/**
 * Inline script embedded in every page <head> before paint. Applies the saved
 * appearance (mode / color scheme / typography) from localStorage so there is
 * no flash of the wrong theme. Mirrors applyTheme() of the reference project.
 */
export function createThemeInitScript(defaults = {}) {
	const mode = defaults.mode ?? 'dark';
	const colorScheme = defaults.colorScheme ?? 'hakushi';
	const style = defaults.style ?? 'sans';
	return `
(function () {
  var SCHEMES = ${JSON.stringify(COLOR_SCHEMES)};
  var STYLES = ${JSON.stringify(THEME_STYLES)};
  try {
    var mode = localStorage.getItem('hakushi_mode') || ${JSON.stringify(mode)};
    var schemeId = localStorage.getItem('hakushi_scheme') || ${JSON.stringify(colorScheme)};
    var styleId = localStorage.getItem('hakushi_style') || ${JSON.stringify(style)};
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
  } catch (e) {}
})();
`;
}
