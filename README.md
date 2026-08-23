# Hakushi (Astro)

An Astro template for a multi-collection notes site with a reader layout, a D3 knowledge graph, and a full theming engine.

## Features

- **Multiple collections** - `docs`, `blog`, `research`, `specs`, `wiki`
  (configured in `src/lib/collections.ts`, schema in `src/content.config.ts`).
- **Browse by folder, date, or tags** - the sidebar island (`src/components/Sidebar.tsx`)
  provides Folders / Dated / Tags tabs with collection filtering,
  a year-month timeline, and a tag cloud. Selections persist in localStorage.
- **Knowledge graph generated from the collections** - articles, categories, tags and
  explicit `[[wikilinks]]` become nodes/edges at build time (`src/lib/graph-data.ts`),
  rendered by the D3 force-simulation browser (`src/components/GraphBrowser.tsx`)
  at `/graph` and as per-article sub-graphs in the right sidebar.
- **Home page = first collection** - `/` renders the most recent article of
  `docs` ("Technical Docs").
- **Rich markdown pipeline**
  - `:::note` / `:::tip` / `:::warning` / `:::danger` / `:::info` / `:::quote` /
    `:::check` callouts and `:::tab` groups (`src/plugins/rehype-enhancer.mjs`)
  - interactive ```chart blocks hydrated with recharts (`src/scripts/charts.tsx`)
  - KaTeX-style math via remark-math + rehype-mathjax, mermaid diagrams via astro-mermaid
  - GitHub-dark code blocks with file-title headers and copy buttons
  - `[[wikilinks]]` resolve to short alias routes (`/quantum-computing`, ...)
- **Theming engine** - 6 color schemes x 4 typography presets, light/dark/auto, applied
  before paint with no FOUC (`src/lib/theme-data.mjs`, `src/lib/theme-init.mjs`,
  `src/components/ThemeMenu.tsx`). Theme preferences persist in localStorage.
- **Command palette** - Cmd/Ctrl+K full-text search over every article.
- **Lucide icons everywhere** - `@lucide/astro` in `.astro` templates, `lucide-react`
  inside islands, raw lucide SVGs injected by the build-time plugins.

## Structure

```
src/
├── content/            # one folder per collection
├── content.config.ts   # collection schemas
├── components/         # Header, Sidebar, ArticleView, GraphBrowser, CommandPalette...
├── layouts/            # BaseLayout (head/fonts/palette) + ReaderShell (3-column reader)
├── lib/                # theme data, article index, backlinks, graph builder
├── pages/
│   ├── index.astro             # home = first collection
│   ├── [collection]/[...slug]  # canonical article routes (/blog/<slug>)
│   ├── [slug].astro            # wikilink alias routes (/quantum-computing)
│   └── graph.astro             # full knowledge-graph view
├── plugins/            # remark/rehype markdown extensions
├── scripts/            # client-side chart hydration + code copy buttons
└── styles/global.css   # Tailwind v4 + global theme styles
```

## Commands

| Command         | Action                                      |
| :-------------- | :------------------------------------------ |
| `pnpm dev`      | Start local dev server at `localhost:4321`  |
| `pnpm build`    | Build the production site to `./dist/`      |
| `pnpm preview`  | Preview the production build                |

> Note: when editing files under `src/plugins/` or `src/lib/theme-data.mjs`, also touch
> `astro.config.mjs` (or delete `node_modules/.astro`) so Astro re-bundles the config
> and invalidates the markdown render cache.
