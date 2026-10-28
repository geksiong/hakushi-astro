/**
 * Inline script embedded in every page <head> before paint. Applies the saved
 * sidebar collapsed states from localStorage as classes on <html>, so a
 * collapsed sidebar is hidden before first paint - no flash and no article
 * relayout on navigation. Mirrors createThemeInitScript().
 */
export function createSidebarInitScript() {
	return `
(function () {
  try {
    var root = document.documentElement;
    if (localStorage.getItem('hakushi_left_collapsed') === 'true') root.classList.add('hakushi-left-collapsed');
    if (localStorage.getItem('hakushi_right_collapsed') === 'true') root.classList.add('hakushi-right-collapsed');
  } catch (e) {}
})();
`;
}
