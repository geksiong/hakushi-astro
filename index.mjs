import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mermaid from 'astro-mermaid';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import { unified } from '@astrojs/markdown-remark';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import remarkWikilinks from './src/plugins/remark-wikilinks.mjs';
import remarkCharts from './src/plugins/remark-charts.mjs';
import remarkAbc from './src/plugins/remark-abc.mjs';
import rehypeEnhancer from './src/plugins/rehype-enhancer.mjs';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';
import { DEFAULT_CONFIG, DEFAULT_COLLECTIONS } from './src/integration/defaults.mjs';

const VIRTUAL_CONFIG = 'virtual:hakushi/config';
const RESOLVED_CONFIG = `\0${VIRTUAL_CONFIG}`;
const VIRTUAL_COMPONENTS = 'virtual:hakushi/components';
const RESOLVED_COMPONENTS = `\0${VIRTUAL_COMPONENTS}`;
const VIRTUAL_STYLES = 'virtual:hakushi/styles';
const RESOLVED_STYLES = `\0${VIRTUAL_STYLES}`;

const defaultComponents = {
	BaseLayout: new URL('./src/layouts/BaseLayout.astro', import.meta.url),
	Header: new URL('./src/components/Header.astro', import.meta.url),
	ArticlePage: new URL('./src/components/ArticlePage.astro', import.meta.url),
	ReaderShell: new URL('./src/layouts/ReaderShell.astro', import.meta.url),
	ArticleView: new URL('./src/components/ArticleView.astro', import.meta.url),
	CollectionPage: new URL('./src/components/CollectionPage.astro', import.meta.url),
};

function normalizeOptions(options) {
	const collections = (options.collections ?? DEFAULT_COLLECTIONS).map((collection) => ({
		description: '',
		iconName: 'BookOpen',
		type: 'folder',
		...collection,
	}));
	if (!Array.isArray(collections) || collections.length === 0) {
		throw new Error('[hakushi] `collections` must contain at least one collection.');
	}
	const ids = new Set();
	for (const collection of collections) {
		if (!collection?.id || !collection?.name) {
			throw new Error('[hakushi] Every collection needs an `id` and `name`.');
		}
		if (ids.has(collection.id)) throw new Error(`[hakushi] Duplicate collection id: ${collection.id}`);
		ids.add(collection.id);
	}

	const config = {
		...DEFAULT_CONFIG,
		...options,
		collections,
		articlesPerPage: options.articlesPerPage ?? DEFAULT_CONFIG.articlesPerPage ?? 5,
		theme: { ...DEFAULT_CONFIG.theme, ...options.theme },
	};
	delete config.components;
	delete config.customCss;
	delete config.routes;
	if (!ids.has(config.defaultCollection)) config.defaultCollection = collections[0].id;
	return config;
}

function resolveUserSpecifier(specifier, root) {
	if (specifier instanceof URL) return fileURLToPath(specifier);
	if (specifier.startsWith('.') || specifier.startsWith('/')) {
		return resolve(fileURLToPath(root), specifier);
	}
	return specifier;
}

function virtualModules(options, config, root) {
	const componentSpecifiers = Object.fromEntries(
		Object.entries(defaultComponents).map(([name, url]) => [
			name,
			options.components?.[name]
				? resolveUserSpecifier(options.components[name], root)
				: fileURLToPath(url),
		])
	);
	const css = [fileURLToPath(new URL('./src/styles/global.css', import.meta.url)), ...(options.customCss ?? []).map((item) => resolveUserSpecifier(item, root))];

	return {
		name: 'hakushi:virtual-modules',
		resolveId(id) {
			if (id === VIRTUAL_CONFIG) return RESOLVED_CONFIG;
			if (id === VIRTUAL_COMPONENTS) return RESOLVED_COMPONENTS;
			if (id === VIRTUAL_STYLES) return RESOLVED_STYLES;
		},
		load(id) {
			if (id === RESOLVED_CONFIG) return `export default ${JSON.stringify(config)};`;
			if (id === RESOLVED_COMPONENTS) {
				return Object.entries(componentSpecifiers)
					.map(([name, specifier]) => `export { default as ${name} } from ${JSON.stringify(specifier)};`)
					.join('\n');
			}
			if (id === RESOLVED_STYLES) return css.map((specifier) => `import ${JSON.stringify(specifier)};`).join('\n');
		},
	};
}

function coreIntegration(options = {}) {
	const config = normalizeOptions(options);
	const routes = { home: true, articles: true, collections: true, aliases: true, graph: true, tags: true, categories: true, notFound: true, ...options.routes };
	return {
		name: 'hakushi',
		hooks: {
			'astro:config:setup': ({ config: astroConfig, updateConfig, injectRoute }) => {
				const add = (enabled, pattern, file) => enabled && injectRoute({ pattern, entrypoint: new URL(file, import.meta.url) });
				add(routes.home, '/', './src/routes/index.astro');
				add(routes.articles, '/[collection]/[...slug]', './src/routes/article.astro');
				add(routes.collections, '/[collection]', './src/routes/collection.astro');
				add(routes.aliases, '/[slug]', './src/routes/alias.astro');
				add(routes.graph, '/graph', './src/routes/graph.astro');
				add(routes.tags, '/tags/[tag]', './src/routes/tag.astro');
				add(routes.categories, '/categories/[category]', './src/routes/category.astro');
				add(routes.notFound, '/404', './src/routes/404.astro');

				updateConfig({
					markdown: {
						processor: unified({
							remarkPlugins: [remarkWikilinks, remarkCharts, remarkAbc, remarkMath, remarkMermaid],
							rehypePlugins: [rehypeMathjax, rehypeEnhancer],
						}),
						shikiConfig: {
							theme: 'github-dark',
							transformers: [{
								name: 'hakushi-code-title',
								pre(node) {
									const meta = this.options.meta?.__raw ?? '';
									const match = meta.match(/title="([^"]+)"/);
									node.properties.dataTitle = match ? match[1] : '';
								},
							}],
						},
					},
					vite: { plugins: [virtualModules(options, config, astroConfig.root), tailwindcss()] },
				});
			},
		},
	};
}

/**
 * Hakushi's Astro integration. It installs the React and Mermaid renderers,
 * configures the Markdown pipeline, and injects the package's routes.
 */
export default function hakushi(options = {}) {
	return [react(), mermaid(options.mermaid), coreIntegration(options)];
}

export { DEFAULT_COLLECTIONS };
