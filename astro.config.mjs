// @ts-check
import { defineConfig } from 'astro/config';
import mermaid from 'astro-mermaid';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import remarkWikilinks from './src/plugins/remark-wikilinks.mjs';
import remarkCharts from './src/plugins/remark-charts.mjs';
import remarkAbc from './src/plugins/remark-abc.mjs';
import rehypeEnhancer from './src/plugins/rehype-enhancer.mjs';

// https://astro.build/config
export default defineConfig({
	markdown: {
		remarkPlugins: [remarkWikilinks, remarkCharts, remarkAbc, remarkMath],
		rehypePlugins: [rehypeMathjax, rehypeEnhancer],
		shikiConfig: {
			theme: 'github-dark',
			transformers: [
				{
					name: 'code-title',
					pre(node) {
						const meta = this.options.meta?.__raw ?? '';
						const match = meta.match(/title="([^"]+)"/);
						node.properties.dataTitle = match ? match[1] : '';
					},
				},
			],
		},
	},
	integrations: [mermaid(), react()],
	vite: {
		plugins: [tailwindcss()],
	},
});
