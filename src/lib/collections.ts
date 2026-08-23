export interface CollectionConfig {
	id: string;
	name: string;
	description: string;
	iconName: 'BookOpen' | 'Calendar' | 'Microscope' | 'FileText' | 'Share2';
	type: 'folder' | 'dated';
}

/** Ported from INITIAL_COLLECTIONS in the reference project. */
export const COLLECTIONS: CollectionConfig[] = [
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

export function getCollectionConfig(id: string): CollectionConfig | undefined {
	return COLLECTIONS.find((c) => c.id === id);
}
