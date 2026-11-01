/// <reference types="astro/client" />

// The shape lives in index.d.ts (shared with consuming sites) so the two can't drift apart.
declare module 'virtual:hakushi/config' {
	const config: import('../index').HakushiResolvedConfig;
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
