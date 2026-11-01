import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mermaid from 'astro-mermaid';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import { unified } from '@astrojs/markdown-remark';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import remarkWikilinks from './src/plugins/remark-wikilinks.mjs';
import remarkFirstH1Title from './src/plugins/remark-first-h1-title.mjs';
import remarkCharts from './src/plugins/remark-charts.mjs';
import remarkAbc from './src/plugins/remark-abc.mjs';
import rehypeEnhancer from './src/plugins/rehype-enhancer.mjs';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';
import { resolveTheme } from './src/lib/theme-catalog.mjs';
import { DEFAULT_CONFIG, DEFAULT_COLLECTIONS, DEFAULT_ABOUT, DEFAULT_SIDEBAR_LINKS, DEFAULT_HEADER_LINKS, DEFAULT_FOOTER, DEFAULT_NOT_FOUND } from './src/integration/defaults.mjs';
import { DEFAULT_FAVICON_HREF } from './src/integration/favicon.mjs';
import { BRAND_ICONS, brandIconSvg } from './src/integration/brand-icons.mjs';

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
	AboutPage: new URL('./src/components/AboutPage.astro', import.meta.url),
	ReaderShell: new URL('./src/layouts/ReaderShell.astro', import.meta.url),
	ArticleView: new URL('./src/components/ArticleView.astro', import.meta.url),
	CollectionPage: new URL('./src/components/CollectionPage.astro', import.meta.url),
	Footer: new URL('./src/components/Footer.astro', import.meta.url),
};

function normalizeOptions(options) {
	// `base`, `pattern`, `folderCategories` and `filenameDates` only configure the content loader; keep filesystem
	// paths out of the config that's bundled for the browser.
	const collections = (options.collections ?? DEFAULT_COLLECTIONS).map(({ base, pattern, folderCategories, filenameDates, ...collection }) => ({
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
		about: { ...DEFAULT_ABOUT, ...options.about },
		sidebarLinks: normalizeLinkList(options.sidebarLinks, DEFAULT_SIDEBAR_LINKS, 'sidebarLinks'),
		headerLinks: normalizeLinkList(options.headerLinks, DEFAULT_HEADER_LINKS, 'headerLinks'),
		articlesPerPage: options.articlesPerPage ?? DEFAULT_CONFIG.articlesPerPage ?? 12,
		theme: resolveTheme(options.theme, DEFAULT_CONFIG.theme),
		googleAnalytics: normalizeGoogleAnalytics(options.googleAnalytics),
		footer: normalizeFooter(options.footer),
		notFound: normalizeNotFound(options.notFound),
	};
	config.favicons = normalizeFavicons(options.favicon);
	config.favicon = config.favicons[0]?.href ?? null;
	delete config.components;
	delete config.customCss;
	delete config.routes;
	if (!ids.has(config.defaultCollection)) config.defaultCollection = collections[0].id;
	return config;
}

/**
 * `googleAnalytics` accepts a measurement ID string or `{ measurementId }`.
 * Returns the validated ID, or null when analytics is off.
 */
function normalizeGoogleAnalytics(value) {
	if (value === undefined || value === null || value === false) return null;
	const id = typeof value === 'string' ? value : value?.measurementId;
	if (typeof id !== 'string' || !/^(G|GT|AW|DC)-[A-Z0-9]+$/i.test(id.trim())) {
		throw new Error('[hakushi] `googleAnalytics` must be a Google tag ID such as "G-XXXXXXXXXX" (or `{ measurementId: "G-XXXXXXXXXX" }`).');
	}
	return id.trim();
}

const FAVICON_TYPES = { svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon', gif: 'image/gif', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', avif: 'image/avif' };

/**
 * `favicon` accepts a URL, `{ href, type?, sizes?, rel? }`, or an array of
 * either (e.g. an SVG icon plus a PNG apple-touch-icon). Unset uses the
 * built-in Hakushi icon; `false` or `null` adds no icon link.
 * Returns the list of `<link>` attributes.
 */
function normalizeFavicons(value) {
	if (value === undefined) return [{ rel: 'icon', href: DEFAULT_FAVICON_HREF, type: 'image/svg+xml' }];
	if (value === null || value === false) return [];
	return (Array.isArray(value) ? value : [value]).map((item) => {
		const icon = typeof item === 'string' ? { href: item } : item;
		if (!icon || typeof icon.href !== 'string' || !icon.href.trim()) {
			throw new Error('[hakushi] `favicon` must be a URL, `{ href, type?, sizes?, rel? }`, or an array of them.');
		}
		const href = icon.href.trim();
		const ext = href.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
		const dataType = href.match(/^data:([^;,]+)/i)?.[1];
		const type = icon.type ?? dataType ?? FAVICON_TYPES[ext];
		return { rel: icon.rel ?? 'icon', href, ...(type && { type }), ...(icon.sizes && { sizes: icon.sizes }) };
	});
}

/**
 * `footer` takes `{ left?, middle?, right? }` text. Returns null (no footer)
 * when it is off or every slot is empty.
 */
function normalizeFooter(value) {
	if (value === undefined || value === null || value === false) return null;
	if (typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('[hakushi] `footer` must be an object such as `{ left: "© {year} Acme", right: "[GitHub](https://github.com/acme)" }`.');
	}
	const footer = { ...DEFAULT_FOOTER };
	for (const slot of ['left', 'middle', 'right']) {
		const text = value[slot];
		if (text === undefined || text === null || text === false) continue;
		if (typeof text !== 'string') throw new Error(`[hakushi] \`footer.${slot}\` must be a string.`);
		footer[slot] = text.trim();
	}
	return footer.left || footer.middle || footer.right ? footer : null;
}

/** `notFound` customizes the built-in 404 page's `title` and `text`. */
function normalizeNotFound(value) {
	const notFound = { ...DEFAULT_NOT_FOUND };
	for (const key of ['title', 'text']) {
		const text = value?.[key];
		if (text === undefined || text === null) continue;
		if (typeof text !== 'string') throw new Error(`[hakushi] \`notFound.${key}\` must be a string.`);
		notFound[key] = text;
	}
	return notFound;
}

function isExternalHref(href) {
	return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

/**
 * Normalize a configurable link list (sidebar or header). Entries need at
 * least a `label` and an `href`; anything else is dropped so a typo can't
 * break the layout. `external` defaults to true for absolute URLs so they
 * open in a new tab.
 */
function normalizeLinkList(links, fallback, optionName) {
	const raw = links ?? fallback;
	if (!Array.isArray(raw)) {
		throw new Error(`[hakushi] \`${optionName}\` must be an array.`);
	}
	return raw
		.filter((link) => link && typeof link.label === 'string' && typeof link.href === 'string')
		.map((link) => ({
			description: '',
			iconName: 'Link',
			...link,
			external: link.external ?? isExternalHref(link.href),
		}));
}

// Brand icon names, matched case-insensitively; `Twitter` is an alias for X.
const BRAND_ICON_NAMES = new Map([
	...Object.keys(BRAND_ICONS).map((name) => [name.toLowerCase(), name]),
	['twitter', 'X'],
]);

/**
 * Give each header link the SVG markup it is drawn with (`iconSvg`), if any:
 * its custom `icon` (SVG markup, or a path to an .svg file relative to the
 * project), else a built-in brand icon named by `iconName`. Other links keep
 * their lucide `iconName`.
 */
function resolveHeaderLinkIcons(links, root) {
	for (const link of links) {
		const { icon } = link;
		delete link.icon;
		if (icon !== undefined && icon !== null && icon !== '') {
			link.iconSvg = readIconSvg(icon, root, link.label);
			continue;
		}
		const brand = BRAND_ICON_NAMES.get(String(link.iconName ?? '').toLowerCase());
		if (brand) {
			link.iconName = brand;
			link.iconSvg = brandIconSvg(brand);
		}
	}
}

function readIconSvg(icon, root, label) {
	const where = `[hakushi] Header link "${label}": \`icon\``;
	let markup = icon;
	if (icon instanceof URL || (typeof icon === 'string' && !icon.trim().startsWith('<'))) {
		const file = resolveUserSpecifier(icon, root);
		try {
			markup = readFileSync(file, 'utf8');
		} catch {
			throw new Error(`${where} file not found: ${file}`);
		}
	} else if (typeof icon !== 'string') {
		throw new Error(`${where} must be SVG markup or a path to an .svg file.`);
	}
	// Keep the <svg> element itself, dropping any XML prolog, doctype or comments around it.
	const svg = markup.match(/<svg[\s>][\s\S]*<\/svg>/i)?.[0];
	if (!svg) throw new Error(`${where} doesn't contain an <svg> element.`);
	return svg;
}

/** Third-party packages Hakushi's browser code imports. */
const CLIENT_DEPENDENCIES = ['recharts', 'd3', 'abcjs', 'lucide-react'];

/**
 * Pre-bundle Hakushi's browser dependencies in dev. Installed as a package,
 * Hakushi is served from node_modules, where Vite neither discovers nor
 * converts its dependencies, so CommonJS modules inside them (such as
 * recharts' use-sync-external-store) fail to load. Listing them also avoids a
 * full page reload when they are discovered on first visit. In a site,
 * they're named through Hakushi (`hakushi > recharts`) because they aren't
 * resolvable from the site's root; in this repository they are.
 */
function clientDependencies(root) {
	const packageDir = fileURLToPath(new URL('.', import.meta.url));
	const isOwnRepo = resolve(packageDir) === resolve(fileURLToPath(root));
	return CLIENT_DEPENDENCIES.map((name) => (isOwnRepo ? name : `hakushi > ${name}`));
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
	const routes = { home: true, articles: true, collections: true, aliases: true, graph: true, tags: true, categories: true, about: true, notFound: true, ...options.routes };
	return {
		name: 'hakushi',
		hooks: {
			'astro:config:setup': ({ config: astroConfig, updateConfig, injectRoute }) => {
				resolveHeaderLinkIcons(config.headerLinks, astroConfig.root);
				const add = (enabled, pattern, file) => enabled && injectRoute({ pattern, entrypoint: new URL(file, import.meta.url) });
				add(routes.home, '/', './src/routes/index.astro');
				add(routes.about, '/about', './src/routes/about.astro');
				add(routes.articles, '/[collection]/[...slug]', './src/routes/article.astro');
				add(routes.collections, '/[collection]', './src/routes/collection.astro');
				add(routes.aliases, '/[...slug]', './src/routes/alias.astro');
				add(routes.graph, '/graph', './src/routes/graph.astro');
				add(routes.tags, '/tags', './src/routes/tags.astro');
				add(routes.tags, '/tags/[tag]', './src/routes/tag.astro');
				add(routes.categories, '/categories/[category]', './src/routes/category.astro');
				add(routes.notFound, '/404', './src/routes/404.astro');

				updateConfig({
					markdown: {
						processor: unified({
							remarkPlugins: [remarkFirstH1Title, remarkWikilinks, remarkCharts, remarkAbc, remarkMath, remarkMermaid],
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
					vite: {
						plugins: [virtualModules(options, config, astroConfig.root), tailwindcss()],
						optimizeDeps: { include: clientDependencies(astroConfig.root) },
					},
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

export { DEFAULT_COLLECTIONS, DEFAULT_ABOUT, DEFAULT_SIDEBAR_LINKS, DEFAULT_HEADER_LINKS, DEFAULT_NOT_FOUND };
