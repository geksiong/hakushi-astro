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
/** Theme colors; each is any CSS color. */
export interface HakushiThemeColors {
	primary?: string;
	primaryHover?: string;
	accent?: string;
	secondary?: string;
	bgMain?: string;
	bgSurface?: string;
	bgSidebar?: string;
	border?: string;
	textMain?: string;
	textMuted?: string;
}
/** A color palette in the theme picker. */
export interface HakushiColorScheme {
	name?: string;
	description?: string;
	/** Short label shown on the palette card (e.g. `'🌊 Ocean'`). Defaults to the name. */
	badge?: string;
	colors?: HakushiThemeColors;
	/** Dark-mode colors. A new scheme without them uses `colors` in both modes. */
	darkColors?: HakushiThemeColors;
}
/** A typography family in the theme picker. */
export interface HakushiTypographyStyle {
	name?: string;
	description?: string;
	/** CSS `font-family` values. */
	fontHeading?: string;
	fontBody?: string;
	fontCode?: string;
	/** Corner radius (`--radius`), e.g. `'0.5rem'`. */
	radius?: string;
	/** Stylesheet URL(s) that load the fonts, e.g. a Google Fonts CSS URL. */
	stylesheet?: string | string[];
}
/** A layout density in the theme picker. */
export interface HakushiLayoutScheme {
	name?: string;
	description?: string;
	badge?: string;
	shellMaxWidth?: string;
	contentMaxWidth?: string;
	contentPaddingX?: string;
	contentPaddingY?: string;
	lineHeightBody?: string;
	lineHeightHeading?: string;
	spacingParagraph?: string;
	cardPadding?: string;
}
/** A font-size step in the theme picker. */
export interface HakushiFontSize {
	name?: string;
	/** Button text, e.g. `'A+'`. Defaults to the name. */
	label?: string;
	/** Caption under the button, e.g. `'18px'`. */
	badge?: string;
	/** Root `font-size`; all rem-based sizes scale from it. */
	rootSize?: string;
	fontSizeBase?: string;
	fontSizeH1?: string;
	fontSizeH2?: string;
	fontSizeH3?: string;
}
/** A preset theme: a named combination of the other choices. */
export interface HakushiPresetTheme {
	name?: string;
	badge?: string;
	tagline?: string;
	description?: string;
	/** Ids from the resolved catalogs; unset fields use the site default. */
	colorScheme?: string;
	style?: string;
	layout?: string;
	fontSize?: string;
}
/**
 * Entries keyed by id. A built-in id merges the fields over the built-in entry,
 * `false` hides a built-in, and a new id adds an entry.
 */
export type HakushiThemeCatalog<T> = Record<string, T | false>;
export type HakushiThemeCatalogName = 'colorSchemes' | 'styles' | 'layouts' | 'fontSizes' | 'presets';
export interface HakushiThemeOptions {
	mode?: 'light' | 'dark' | 'auto';
	/** Default color scheme id (built-in or custom). */
	colorScheme?: string;
	/** Default typography style id. */
	style?: string;
	/** Default layout id. */
	layout?: string;
	/** Default font size id. */
	fontSize?: string;
	/** Default preset id; its scheme, style, layout and font size become the defaults unless set above. */
	preset?: string;
	colorSchemes?: HakushiThemeCatalog<HakushiColorScheme>;
	styles?: HakushiThemeCatalog<HakushiTypographyStyle>;
	layouts?: HakushiThemeCatalog<HakushiLayoutScheme>;
	fontSizes?: HakushiThemeCatalog<HakushiFontSize>;
	presets?: HakushiThemeCatalog<HakushiPresetTheme>;
	/**
	 * Include the built-in entries (default `true`). `false` keeps only configured
	 * entries in every catalog; an object switches catalogs individually.
	 * With built-ins off, naming a built-in id in a catalog still includes it.
	 */
	builtIns?: boolean | Partial<Record<HakushiThemeCatalogName, boolean>>;
}
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
	/** Show a Listen control on articles that reads them aloud with the browser's speech synthesis. Defaults to `true`; hidden where unsupported. */
	readAloud?: boolean;
	theme?: HakushiThemeOptions;
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
		readAloud: boolean;
		/** Default selection plus the resolved catalogs (built-ins merged with configuration), keyed by id in picker order. */
		theme: {
			mode: 'light' | 'dark' | 'auto';
			colorScheme: string;
			style: string;
			layout: string;
			fontSize: string;
			preset?: string;
			colorSchemes: Record<string, unknown>;
			styles: Record<string, unknown>;
			layouts: Record<string, unknown>;
			fontSizes: Record<string, unknown>;
			presets: Record<string, unknown>;
		};
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
