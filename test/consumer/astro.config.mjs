import { defineConfig } from 'astro/config';
import hakushi from 'hakushi';

export default defineConfig({
	integrations: [hakushi({
		title: 'Consumer Notes',
		description: 'A package-boundary test site',
		versionLabel: 'custom',
		defaultCollection: 'handbook',
		theme: { mode: 'light', colorScheme: 'nord' },
		customCss: ['./src/overrides.css'],
		components: { Header: './src/components/CustomHeader.astro' },
		collections: [
			{ id: 'handbook', name: 'Guides', iconName: 'BookOpen', type: 'folder' },
			{ id: 'portfolio', name: 'Portfolio', iconName: 'Layers', type: 'folder' },
		],
	})],
});
