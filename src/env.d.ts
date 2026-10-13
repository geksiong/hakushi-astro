/// <reference types="astro/client" />

declare module 'virtual:hakushi/config' {
	const config: {
		title: string;
		description: string;
		versionLabel: string;
		lang: string;
		favicon: string | null;
		defaultCollection: string;
		collections: import('./lib/collections').CollectionConfig[];
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

declare module 'virtual:hakushi/styles' {}
