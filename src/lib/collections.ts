import config from 'virtual:hakushi/config';

export interface CollectionConfig {
	id: string;
	name: string;
	description: string;
	iconName?: import('../../index').HakushiIconName;
	type?: 'folder' | 'dated';
	articlesPerPage?: number;
}

/** Collection navigation supplied by the consuming project's integration config. */
export const COLLECTIONS: CollectionConfig[] = config.collections;

export function getCollectionConfig(id: string): CollectionConfig | undefined {
	return COLLECTIONS.find((c) => c.id === id);
}
