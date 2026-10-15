import config from 'virtual:hakushi/config';

export interface SidebarLink {
	label: string;
	href: string;
	description: string;
	iconName?: string;
	external?: boolean;
}

/** Configurable pages/sites listed in the sidebar below the collections. */
export const SIDEBAR_LINKS: SidebarLink[] = config.sidebarLinks ?? [];

export interface AboutConfig {
	title: string;
	description: string;
	content: string;
}

/** Content rendered by the built-in `/about` route. */
export const ABOUT: AboutConfig = config.about;

/** An internal link is active when the current path matches its href. */
export function isSidebarLinkActive(link: SidebarLink, pathname: string): boolean {
	if (link.external) return false;
	const normalize = (p: string) => p.replace(/\/+$/, '') || '/';
	return normalize(pathname) === normalize(link.href);
}
