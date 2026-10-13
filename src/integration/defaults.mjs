export const DEFAULT_COLLECTIONS = [
	{
		id: 'docs',
		name: 'Technical Docs',
		description: 'Developer guides, setup instructions, and architecture references.',
		iconName: 'BookOpen',
		type: 'folder',
	},
	{
		id: 'blog',
		name: 'Dev Blog',
		description: 'Chronological posts, release notes, and thought pieces.',
		iconName: 'Calendar',
		type: 'dated',
	},
	{
		id: 'research',
		name: 'Research Notes',
		description: 'Deep dives, mathematical proofs, and experimental algorithms.',
		iconName: 'Microscope',
		type: 'folder',
	},
	{
		id: 'specs',
		name: 'Specs & RFCs',
		description: 'System specifications, architecture decision records (ADRs).',
		iconName: 'FileText',
		type: 'folder',
	},
	{
		id: 'wiki',
		name: 'Personal Wiki',
		description: 'Connected knowledge hub, digital garden, and learning logs.',
		iconName: 'Share2',
		type: 'folder',
	},
];

export const DEFAULT_CONFIG = {
	title: 'Hakushi',
	description: 'Notes & Knowledge Graph Engine',
	versionLabel: 'v2.5',
	lang: 'en',
	favicon: null,
	defaultCollection: 'docs',
	collections: DEFAULT_COLLECTIONS,
	articlesPerPage: 5,
	theme: {
		mode: 'dark',
		colorScheme: 'hakushi',
		style: 'sans',
	},
};
