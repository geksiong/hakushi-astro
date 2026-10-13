# Hakushi

Hakushi is an Astro integration for publishing a multi-collection knowledge base. It provides routes, a reader UI, full-text search, themes, Markdown extensions, backlinks, and an interactive knowledge graph. The consuming Astro project owns its content and can override Hakushi's configuration, CSS, components, or complete routes.

Hakushi currently requires Astro 7.

## Install

```sh
npm install hakushi
```

Add the integration to `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import hakushi from 'hakushi';

export default defineConfig({
  integrations: [hakushi({
    title: 'Acme Knowledge Base',
    description: 'Engineering notes and product documentation',
  })],
});
```

Define the content collections in `src/content.config.ts`:

```ts
import { createHakushiCollections } from 'hakushi/loaders';
export const collections = createHakushiCollections();
```

Add Markdown to any default directory: `src/content/docs`, `blog`, `research`, `specs`, or `wiki`. At least `docs` must contain an article:

```md
---
title: Getting started
summary: The first page in this knowledge base.
tags: [guide]
---

# Welcome

Link to another note with [[another-note]].
```

Run `npm run dev`. Hakushi creates `/`, collection routes such as `/docs/getting-started`, short wikilink aliases, `/graph`, tag/category pages, and `/404`.

## Frontmatter and schema

Only `title` is required. The built-in schema also accepts `summary`, `category`, `tags`, `date`, `author`, and `draft`. Draft entries are excluded.

Extend it with project fields:

```ts
import { createHakushiCollections, hakushiSchema } from 'hakushi/loaders';
import { z } from 'astro/zod';

export const collections = createHakushiCollections({
  schema: hakushiSchema({
    extend: { product: z.string().optional() },
  }),
});
```

The package also exports `hakushiLoader({ base, pattern })` for defining an individual collection.

## Configuration

```js
hakushi({
  title: 'Acme Docs',
  description: 'Internal engineering knowledge',
  versionLabel: '2026.10',
  lang: 'en-GB',
  favicon: '/brand/favicon.svg',
  defaultCollection: 'handbook',
  theme: {
    mode: 'auto',          // light, dark, auto
    colorScheme: 'nord',   // hakushi, obsidian, nord, amber, monokai, rose
    style: 'sans',         // sans, serif, mono, editorial
  },
  articlesPerPage: 5,     // default articles per page when browsing a collection
  collections: [
    { id: 'handbook', name: 'Team Handbook', iconName: 'BookOpen', type: 'folder', articlesPerPage: 5 },
    { id: 'updates', name: 'Updates', iconName: 'Calendar', type: 'dated' },
  ],
})
```

When changing collections, give the loader the same IDs:

```ts
import { createHakushiCollections } from 'hakushi/loaders';

const navigation = [{ id: 'handbook' }, { id: 'updates' }];
export const collections = createHakushiCollections({ collections: navigation });
```

Navigation supports `BookOpen`, `Calendar`, `Microscope`, `FileText`, and `Share2` icons. A `dated` collection gets date-oriented navigation; `folder` is the default.

## Override styles

Custom styles load after Hakushi's CSS:

```js
hakushi({ customCss: ['./src/styles/hakushi-overrides.css'] })
```

Override the design tokens in that file:

```css
:root {
  --primary: #0057b8;
  --primary-hover: #003f87;
  --accent: #00a6a6;
  --secondary: #7c3aed;
  --bg-main: #f7f8fa;
  --bg-surface: #fff;
  --bg-sidebar: #eef1f5;
  --border: #d7dce3;
  --text-main: #172033;
  --text-muted: #667085;
  --font-heading: system-ui, sans-serif;
  --font-body: system-ui, sans-serif;
  --font-code: ui-monospace, monospace;
  --radius: 0.75rem;
}
```

The interactive theme picker writes these tokens inline. For a permanent brand theme, hide the picker with a custom header or use a higher-specificity override.

## Override components

Component paths are relative to the consuming project:

```js
hakushi({
  components: {
    Header: './src/components/DocsHeader.astro',
    ArticleView: './src/components/ArticleView.astro',
    CollectionPage: './src/components/CollectionPage.astro',
  },
})
```

| Component | Contract |
| --- | --- |
| `BaseLayout` | `title?`, `description?`, default slot |
| `Header` | `view?: 'reader' \| 'graph'` |
| `ArticlePage` | `entry` |
| `ReaderShell` | `entry?`, `currentCollection?`, `headings?`, `subgraph?`, default slot |
| `ArticleView` | `entry`, `Content`, `headings`, `readingTime`, `backlinks` |
| `CollectionPage` | `collection`, `articles` |

Example header:

```astro
---
const { view } = Astro.props;
---
<header>
  <a href="/">Acme Docs</a>
  <a href="/graph" aria-current={view === 'graph' ? 'page' : undefined}>Graph</a>
</header>
```

## Keep project routes

Disable any injected route that the consuming site supplies itself:

```js
hakushi({ routes: { home: false, collections: false, notFound: false } })
```

Keys are `home`, `articles`, `collections`, `aliases`, `graph`, `tags`, `categories`, and `notFound`. Disabling `home`, for example, lets the project keep `src/pages/index.astro`.

## Markdown features

- `[[wikilinks]]` and `[[target|custom labels]]`
- `:::note`, `tip`, `warning`, `danger`, `info`, `quote`, and `check` callouts
- `:::tab` groups
- Mermaid, chart, and ABC music notation fences
- Math through `remark-math` and MathJax
- Code titles such as ```` ```ts title="example.ts" ````

Hakushi owns the unified Markdown processor. Take care not to replace `markdown.processor` when adding more Markdown configuration.

## Package development and publishing

```sh
pnpm astro dev --background
pnpm build
pnpm --dir test/consumer build
npm pack --dry-run
```

Manage the background server with `pnpm astro dev status`, `pnpm astro dev logs`, and `pnpm astro dev stop`.

Before publishing, choose a unique npm name if `hakushi` is unavailable, update the README imports, set the intended version, and run `npm publish` (or `npm publish --access public` for a scoped public package).

References: [Astro integrations](https://docs.astro.build/en/guides/integrations/), [routing](https://docs.astro.build/en/guides/routing/), [content collections](https://docs.astro.build/en/guides/content-collections/), and [styles](https://docs.astro.build/en/guides/styling/).
