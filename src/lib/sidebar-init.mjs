/**
 * Inline script embedded in every page <head> before paint. Applies the saved
 * sidebar collapsed state from localStorage so the server-rendered (always
 * expanded) sidebar is shrunk before first paint - no expanded -> collapsed
 * flash on navigation. Mirrors createThemeInitScript().
 */
export function createSidebarInitScript() {
	return `
(function () {
  try {
    if (localStorage.getItem('hakushi_sidebar_collapsed') === 'true') {
      document.documentElement.classList.add('hakushi-sidebar-collapsed');
    }
  } catch (e) {}
})();
`;
}
