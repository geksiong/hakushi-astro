import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const baseSchema = z.object({
	title: z.string(),
	category: z.string().optional(),
	tags: z.array(z.string()).default([]),
	/** Article date (YYYY-MM-DD) */
	date: z.coerce.date().optional(),
	author: z.string().optional(),
	summary: z.string().optional(),
	draft: z.boolean().default(false),
});

export const collections = {
	docs: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
		schema: baseSchema,
	}),
	blog: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
		schema: baseSchema,
	}),
	research: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
		schema: baseSchema,
	}),
	specs: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/specs' }),
		schema: baseSchema,
	}),
	wiki: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/wiki' }),
		schema: baseSchema,
	}),
};
