import type { AstroIntegration } from 'astro';

export type HakushiIconName = 'BookOpen' | 'Calendar' | 'Microscope' | 'FileText' | 'Share2' | 'Folder' | 'Layers';
export interface HakushiCollection {
	id: string;
	name: string;
	description?: string;
	iconName?: HakushiIconName;
	type?: 'folder' | 'dated';
	articlesPerPage?: number;
}
export interface HakushiOptions {
	title?: string;
	description?: string;
	versionLabel?: string;
	lang?: string;
	favicon?: string | null;
	defaultCollection?: string;
	collections?: HakushiCollection[];
	articlesPerPage?: number;
	theme?: { mode?: 'light' | 'dark' | 'auto'; colorScheme?: string; style?: string };
	customCss?: (string | URL)[];
	components?: Partial<Record<'BaseLayout' | 'Header' | 'ArticlePage' | 'ReaderShell' | 'ArticleView' | 'CollectionPage', string | URL>>;
	routes?: Partial<Record<'home' | 'articles' | 'collections' | 'aliases' | 'graph' | 'tags' | 'categories' | 'notFound', boolean>>;
	mermaid?: Record<string, unknown>;
}
export const DEFAULT_COLLECTIONS: HakushiCollection[];
export default function hakushi(options?: HakushiOptions): AstroIntegration[];

declare module 'virtual:hakushi/config' {
	const config: Required<Pick<HakushiOptions, 'title' | 'description' | 'versionLabel' | 'lang' | 'favicon' | 'defaultCollection' | 'collections'>> & {
		articlesPerPage: number;
		theme: { mode: 'light' | 'dark' | 'auto'; colorScheme: string; style: string };
	};
	export default config;
}

declare module 'virtual:hakushi/components' {
	export const BaseLayout: any;
	export const Header: any;
	export const ArticlePage: any;
	export const ReaderShell: any;
	export const ArticleView: any;
	export const CollectionPage: any;
}
