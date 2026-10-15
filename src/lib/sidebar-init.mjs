/**
 * Inline script embedded in every page <head> before paint. Applies the saved
 * sidebar collapsed states from localStorage so the server-rendered (always
 * expanded) sidebars are shrunk before first paint - no expanded -> collapsed
 * flash or article relayout on navigation. Mirrors createThemeInitScript().
 */
export function createSidebarInitScript() {
	return `
(function () {
  try {
    if (localStorage.getItem('hakushi_sidebar_collapsed') === 'true') {
      document.documentElement.classList.add('hakushi-sidebar-collapsed');
    }
    if (localStorage.getItem('hakushi_right_sidebar_collapsed') === 'true') {
      document.documentElement.classList.add('hakushi-right-collapsed');
    }
  } catch (e) {}
})();
`;
}
