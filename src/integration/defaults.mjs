export const DEFAULT_ABOUT = {
	title: 'About',
	description: 'What this knowledge base is and how to use it.',
	content:
		'This knowledge base collects notes, guides, and research in one searchable place. Browse the collections in the sidebar, follow wikilinks between articles, or open the knowledge graph to see how everything connects.',
};

export const DEFAULT_SIDEBAR_LINKS = [
	{
		label: 'About',
		href: '/about',
		description: 'What this knowledge base is and how to use it.',
		iconName: 'Info',
	},
];

/** Right-side header icons (social/contact links). Empty by default. */
export const DEFAULT_HEADER_LINKS = [];
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
	{
		id: 'portfolio',
		name: 'Portfolio',
		description: 'Selected projects, artwork, and visual studies.',
		iconName: 'Layers',
		type: 'folder',
		articlesPerPage: 9,
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
	about: DEFAULT_ABOUT,
	sidebarLinks: DEFAULT_SIDEBAR_LINKS,
	headerLinks: DEFAULT_HEADER_LINKS,
	articlesPerPage: 5,
	theme: {
		mode: 'dark',
		colorScheme: 'hakushi',
		style: 'sans',
	},
};
