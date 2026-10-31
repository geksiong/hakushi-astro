import { defineConfig } from 'astro/config';
import hakushi from 'hakushi';

export default defineConfig({
	integrations: [hakushi({
		title: 'Consumer Notes',
		description: 'A package-boundary test site',
		versionLabel: 'custom',
		defaultCollection: 'handbook',
		theme: {
			mode: 'light',
			preset: 'consumer',
			colorSchemes: {
				harbor: {
					name: 'Harbor',
					badge: '⚓ Harbor',
					colors: { primary: '#0f766e', primaryHover: '#115e59', accent: '#ea580c', bgMain: '#f6fbfa' },
					darkColors: { primary: '#2dd4bf', primaryHover: '#5eead4', accent: '#fb923c', bgMain: '#06201d' },
				},
				nord: { name: 'Nord (consumer)' },
				monokai: false,
			},
			styles: { humanist: { name: 'Humanist', description: 'Lexend body', fontBody: 'Lexend, sans-serif', stylesheet: 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600&display=swap' } },
			layouts: { wide: { name: 'Wide', badge: 'Roomy', contentMaxWidth: '72rem', shellMaxWidth: '104rem' } },
			presets: { consumer: { name: 'Consumer Harbor', tagline: 'Custom', colorScheme: 'harbor', style: 'humanist', layout: 'wide' } },
		},
		customCss: ['./src/overrides.css'],
		components: { Header: './src/components/CustomHeader.astro' },
		collections: [
			{ id: 'handbook', name: 'Guides', iconName: 'BookOpen', type: 'folder' },
			{ id: 'portfolio', name: 'Portfolio', iconName: 'Layers', type: 'folder' },
		],
	})],
});
