import type { AstroIntegration } from 'astro';

export type HakushiIconName = 'BookOpen' | 'Calendar' | 'Microscope' | 'FileText' | 'Share2' | 'Folder' | 'Layers' | 'Info' | 'Link' | 'Globe' | 'Mail' | 'Github' | 'GitFork' | 'ExternalLink' | 'Home' | 'Rss' | 'MessageCircle';
export interface HakushiCollection {
	id: string;
	name: string;
	description?: string;
	iconName?: HakushiIconName;
	type?: 'folder' | 'dated';
	articlesPerPage?: number;
}
export interface HakushiSidebarLink {
	/** Link text shown in the sidebar. */
	label: string;
	/** Internal path (e.g. `/about`) or absolute URL (e.g. `https://example.com`). */
	href: string;
	/** Tooltip / accessible description. */
	description?: string;
	iconName?: HakushiIconName;
	/** Defaults to true for absolute URLs; external links open in a new tab. */
	external?: boolean;
}
export interface HakushiAbout {
	title?: string;
	description?: string;
	/** Plain text shown on the About page; blank lines separate paragraphs. */
	content?: string;
}
/** A configurable header icon link; same shape as a sidebar link. */
export type HakushiHeaderLink = HakushiSidebarLink;
export interface HakushiOptions {
	title?: string;
	description?: string;
	versionLabel?: string;
	lang?: string;
	favicon?: string | null;
	defaultCollection?: string;
	collections?: HakushiCollection[];
	/** Content rendered by the built-in `/about` route. */
	about?: HakushiAbout;
	/** Extra pages/sites listed in the sidebar below the collections. Defaults to an About link. */
	sidebarLinks?: HakushiSidebarLink[];
	/** Icon-only links on the right side of the header (e.g. social/contact links). Defaults to none. */
	headerLinks?: HakushiHeaderLink[];
	articlesPerPage?: number;
	theme?: { mode?: 'light' | 'dark' | 'auto'; colorScheme?: string; style?: string };
	customCss?: (string | URL)[];
	components?: Partial<Record<'BaseLayout' | 'Header' | 'ArticlePage' | 'AboutPage' | 'ReaderShell' | 'ArticleView' | 'CollectionPage', string | URL>>;
	routes?: Partial<Record<'home' | 'articles' | 'collections' | 'aliases' | 'graph' | 'tags' | 'categories' | 'about' | 'notFound', boolean>>;
	mermaid?: Record<string, unknown>;
}
export const DEFAULT_COLLECTIONS: HakushiCollection[];
export const DEFAULT_ABOUT: Required<HakushiAbout>;
export const DEFAULT_SIDEBAR_LINKS: HakushiSidebarLink[];
export const DEFAULT_HEADER_LINKS: HakushiHeaderLink[];
export default function hakushi(options?: HakushiOptions): AstroIntegration[];

declare module 'virtual:hakushi/config' {
	const config: Required<Pick<HakushiOptions, 'title' | 'description' | 'versionLabel' | 'lang' | 'favicon' | 'defaultCollection' | 'collections' | 'about' | 'sidebarLinks' | 'headerLinks'>> & {
		articlesPerPage: number;
		theme: { mode: 'light' | 'dark' | 'auto'; colorScheme: string; style: string };
	};
	export default config;
}

declare module 'virtual:hakushi/components' {
	export const BaseLayout: any;
	export const Header: any;
	export const ArticlePage: any;
	export const AboutPage: any;
	export const ReaderShell: any;
	export const ArticleView: any;
	export const CollectionPage: any;
}
