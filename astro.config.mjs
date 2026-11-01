// @ts-check
import { defineConfig } from 'astro/config';
import hakushi from './index.mjs';

// https://astro.build/config
export default defineConfig({
	// The repository doubles as a development fixture. Its filesystem routes
	// remain enabled while package route injection is exercised by consumers.
	integrations: [hakushi({
		// The demo offers every built-in preset, palette, typography and layout.
		theme: { builtIns: true },
		routes: {
			home: false,
			articles: false,
			collections: false,
			aliases: false,
			graph: false,
			tags: false,
			categories: false,
			notFound: false,
		},
	})],
});
