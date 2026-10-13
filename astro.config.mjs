// @ts-check
import { defineConfig } from 'astro/config';
import hakushi from './index.mjs';

// https://astro.build/config
export default defineConfig({
	// The repository doubles as a development fixture. Its filesystem routes
	// remain enabled while package route injection is exercised by consumers.
	integrations: [hakushi({
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
