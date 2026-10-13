import type { AstroIntegration } from 'astro';

export type HakushiIconName = 'BookOpen' | 'Calendar' | 'Microscope' | 'FileText' | 'Share2';
export interface HakushiCollection {
	id: string;
	name: string;
	description?: string;
	iconName?: HakushiIconName;
	type?: 'folder' | 'dated';
}
export interface HakushiOptions {
	title?: string;
	description?: string;
	versionLabel?: string;
	lang?: string;
	favicon?: string | null;
	defaultCollection?: string;
	collections?: HakushiCollection[];
	theme?: { mode?: 'light' | 'dark' | 'auto'; colorScheme?: string; style?: string };
	customCss?: (string | URL)[];
	components?: Partial<Record<'BaseLayout' | 'Header' | 'ArticlePage' | 'ReaderShell' | 'ArticleView', string | URL>>;
	routes?: Partial<Record<'home' | 'articles' | 'aliases' | 'graph' | 'tags' | 'categories' | 'notFound', boolean>>;
	mermaid?: Record<string, unknown>;
}
export const DEFAULT_COLLECTIONS: HakushiCollection[];
export default function hakushi(options?: HakushiOptions): AstroIntegration[];

declare module 'virtual:hakushi/config' {
	const config: Required<Pick<HakushiOptions, 'title' | 'description' | 'versionLabel' | 'lang' | 'favicon' | 'defaultCollection' | 'collections'>> & {
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
}
