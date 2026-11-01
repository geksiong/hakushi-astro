/// <reference types="astro/client" />

declare module 'virtual:hakushi/config' {
	const config: {
		title: string;
		description: string;
		versionLabel: string;
		lang: string;
		favicon: string | null;
		favicons: { rel: string; href: string; type?: string; sizes?: string }[];
		footer: { left: string; middle: string; right: string } | null;
		notFound: { title: string; text: string };
		defaultCollection: string;
		readAloud: boolean;
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
	export const Footer: any;
}

declare module 'virtual:hakushi/styles' {}
