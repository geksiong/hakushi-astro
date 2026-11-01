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

Add Markdown to any default directory: `src/content/docs`, `blog`, `research`, `specs`, `wiki`, or `portfolio`. At least `docs` must contain an article:

```md
---
title: Getting started
summary: The first page in this knowledge base.
tags: [guide]
---

# Welcome

Link to another note with [[another-note]].
```

Run `npm run dev`. Hakushi creates `/`, `/about`, collection routes such as `/docs/getting-started`, short wikilink aliases, `/graph`, a `/tags` index, tag/category pages, and `/404`.

## Frontmatter and schema

No field is required. The built-in schema accepts `title`, `summary`, `category`, `mainImage`, `tags`, `date`, `author`, and `draft`. Draft entries are excluded.

Every collection, category, and tag listing lets readers switch between grid and list layouts. The choice is saved for each listing. The default `portfolio` collection contains sample projects, artwork, and visual studies; it needs no special collection type. Add an optional `mainImage` to each article to show it in listings and above the article body. Use a path from `public/` (for example `/images/studio.jpg`) or an absolute image URL. Articles without an image display as text cards.

For a custom portfolio collection, give the integration and loader the same ID:

```js
// astro.config.mjs
collections: [{ id: 'projects', name: 'Projects', iconName: 'Layers' }]
```

```ts
// src/content.config.ts
export const collections = createHakushiCollections({ collections: [{ id: 'projects' }] });
```

Then add an article at `src/content/projects/studio-renovation.md`:

```md
---
title: Studio renovation
mainImage: /images/studio.jpg
summary: A small workspace redesign.
---

Project details go here.
```

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

When frontmatter has no `title`, the article's first level-1 heading (`# Title`) is used instead — in the article header, sidebar and collection listings, search, backlinks, and the knowledge graph. That heading is then removed from the rendered article body (including the table of contents) so it isn't shown twice. Articles with a frontmatter `title` render their body unchanged. Without either, the entry id is shown.

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
    colorScheme: 'nord',   // default palette (see "Custom themes" below)
    style: 'sans',         // default typography
  },
  articlesPerPage: 12,    // articles per page when browsing a collection (default 12)
  readAloud: true,        // Listen control that reads articles aloud (default true)
  googleAnalytics: 'G-XXXXXXXXXX', // optional Google Analytics 4 measurement ID
  footer: {               // optional site footer (see "Footer" below)
    left: '© {year} Acme',
    middle: 'Built with [Hakushi](https://github.com/acme/hakushi)',
    right: '[Privacy](/privacy)',
  },
  notFound: {             // built-in 404 page
    title: 'Lost?',
    text: 'That page has moved or never existed.',
  },
  collections: [
    { id: 'handbook', name: 'Team Handbook', iconName: 'BookOpen', type: 'folder', articlesPerPage: 5 },
    { id: 'updates', name: 'Updates', iconName: 'Calendar', type: 'dated' },
    { id: 'projects', name: 'Projects', iconName: 'Layers', articlesPerPage: 9 },
  ],
  about: {
    title: 'About',
    description: 'What this knowledge base is and how to use it.',
    content: 'Plain text for the built-in /about page; blank lines separate paragraphs.',
  },
  sidebarLinks: [
    { label: 'About', href: '/about', iconName: 'Info', description: 'About this site' },
    { label: 'GitHub', href: 'https://github.com/acme/docs', iconName: 'Github' },
  ],
  headerLinks: [
    { label: 'GitHub', href: 'https://github.com/acme/docs', iconName: 'GitHub' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/acme', iconName: 'LinkedIn' },
    { label: 'Codeberg', href: 'https://codeberg.org/acme', icon: './src/icons/codeberg.svg' },
    { label: 'Contact', href: 'mailto:hello@acme.com', iconName: 'Mail' },
  ],
})
```

`sidebarLinks` are listed as plain text links at the bottom of the sidebar (desktop and mobile drawer), below the collection tree and the Knowledge Graph and Tags links. Each entry needs a `label` and an `href`; `iconName`, `description`, and `external` are optional. `external` defaults to `true` for absolute URLs, which open in a new tab. `headerLinks` use the same entry shape and render as icon-only buttons on the right side of the header, before the theme picker — intended for social media and contact links. They default to none. Header link icons support `Info`, `Link`, `Globe`, `Mail`, `GitFork`, `ExternalLink`, `Home`, `Rss`, `MessageCircle`, and the collection icons, plus the brand icons `GitHub`, `LinkedIn`, `X` (alias `Twitter`), `Bluesky`, `Mastodon`, `YouTube` and `Instagram` (brand names are case-insensitive). Brand icons are drawn in the header's icon color rather than brand colors. For any other icon, set `icon` to SVG markup or the path of an `.svg` file relative to the project root; it overrides `iconName` and is inlined at build time, so use `fill="currentColor"` (or `stroke="currentColor"`) for it to follow the theme. A missing file or one without an `<svg>` stops the build with an error. The built-in `/about` route renders `about` and can be replaced with a custom `AboutPage` component (see below) or disabled with `routes: { about: false }`.

When changing collections, give the loader the same IDs:

```ts
import { createHakushiCollections } from 'hakushi/loaders';

const navigation = [{ id: 'handbook' }, { id: 'updates' }];
export const collections = createHakushiCollections({ collections: navigation });
```

Each collection reads Markdown from `src/content/<id>` by default. Set `base` on a collection to read it from another folder (relative to the project root), and optionally `pattern` to change which files are matched (default `**/*.md`). Change the parent folder for every collection with the top-level `base` option:

```ts
export const collections = createHakushiCollections({
  base: './content', // collections without their own base read ./content/<id>
  collections: [
    { id: 'handbook', base: './docs/handbook' },
    { id: 'updates', base: '../shared-notes/updates', pattern: ['**/*.md', '!drafts/**'] },
  ],
});
```

You can pass the same array to the integration's `collections` option; it ignores `base` and `pattern` and leaves them out of the browser bundle.

Navigation supports `BookOpen`, `Calendar`, `Microscope`, `FileText`, and `Share2` icons. A `dated` collection gets date-oriented navigation; `folder` is the default.

## Custom themes

The theme picker offers presets (themes), color palettes, typography styles, layouts, and font sizes. Configure any of them under `theme`:

```js
hakushi({
  theme: {
    preset: 'acme',                  // default for new visitors
    builtIns: { colorSchemes: true }, // also offer the built-in palettes (see below)
    colorSchemes: {
      ocean: {
        name: 'Ocean',
        badge: '🌊 Ocean',
        colors: { primary: '#0369a1', primaryHover: '#075985', accent: '#0d9488', bgMain: '#f5fafd' },
        darkColors: { primary: '#38bdf8', primaryHover: '#7dd3fc', accent: '#2dd4bf', bgMain: '#06141f' },
      },
      nord: { colors: { primary: '#2e5d8a' } },  // adjust a built-in
      monokai: false,                            // hide a built-in
    },
    styles: {
      brand: {
        name: 'Acme Sans',
        description: 'Lexend body, Fraunces headings',
        fontHeading: 'Fraunces, Georgia, serif',
        fontBody: 'Lexend, system-ui, sans-serif',
        fontCode: '"JetBrains Mono", monospace',
        radius: '0.75rem',
        stylesheet: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Lexend:wght@400;600&display=swap',
      },
    },
    layouts: {
      wide: { name: 'Wide', badge: 'Roomy', contentMaxWidth: '72rem', shellMaxWidth: '104rem' },
    },
    fontSizes: {
      xxl: { name: 'Huge', label: 'A+++', badge: '22px', rootSize: '22px', fontSizeBase: '1.375rem' },
    },
    presets: {
      acme: { name: 'Acme', tagline: 'House style', description: 'Ocean palette with Acme Sans', colorScheme: 'ocean', style: 'brand', layout: 'wide' },
    },
  },
})
```

**What the picker offers.** Light/dark/auto and the font sizes are always available. Presets, palettes, typography and layouts offer only what you configure, plus the default choice, so a site that configures nothing is locked to its defaults. To offer Hakushi's built-in entries as well, switch them on with `builtIns`:

```js
theme: {
  builtIns: { presets: true, layouts: true }, // built-in presets and layout spacings
  // builtIns: true                           // every built-in
}
```

The keys are `presets`, `colorSchemes`, `styles`, `layouts` and `fontSizes`. They default to `false`, except `fontSizes`, which defaults to `true`; only `builtIns: { fontSizes: false }` removes the built-in font sizes. The picker shows a section only when it has more than one choice, so a single palette, typography style, layout or preset doesn't appear at all. Built-in presets bring the palettes, styles and layouts they use, but those aren't listed in their own sections unless switched on too.

Each catalog is keyed by id:

- **A new id** adds an entry. Fields you leave out come from the default built-in (`hakushi`, `sans`, `comfortable`, `md`). A new palette without `darkColors` uses its `colors` in both modes. Custom entries are listed before the built-ins in the picker.
- **A built-in id** merges your fields over the built-in entry. For palettes this applies per color, so `nord: { colors: { primary } }` changes only the light-mode primary.
- **`false`** hides a built-in. Built-in presets that use a hidden palette, style, layout, or font size are hidden too.
- **A built-in id with built-ins off**, such as `nord: {}`, offers that one entry.

The ids are `hakushi`, `paper`, `academic`, `refined`, `social`, `earth`, `obsidian`, `nord`, `amber`, `monokai`, `rose` (palettes); `sans`, `serif`, `mono`, `editorial`, `literary`, `monograph`, `organic`, `geometric` (styles); `compact`, `comfortable`, `spacious` (layouts); `sm`, `md`, `lg`, `xl` (font sizes); and `paper`, `academic`, `refined`, `social`, `earth`, `hakushi` (presets).

| Catalog | Fields |
| --- | --- |
| `colorSchemes` | `name`, `description`, `badge`; `colors` and `darkColors` with `primary`, `primaryHover`, `accent`, `secondary`, `bgMain`, `bgSurface`, `bgSidebar`, `border`, `textMain`, `textMuted` |
| `styles` | `name`, `description`, `fontHeading`, `fontBody`, `fontCode`, `radius`, `stylesheet` (URL or list of URLs that load the fonts) |
| `layouts` | `name`, `description`, `badge`, `shellMaxWidth`, `contentMaxWidth`, `contentPaddingX`, `contentPaddingY`, `lineHeightBody`, `lineHeightHeading`, `spacingParagraph`, `cardPadding` |
| `fontSizes` | `name`, `label`, `badge`, `rootSize`, `fontSizeBase`, `fontSizeH1`, `fontSizeH2`, `fontSizeH3` |
| `presets` | `name`, `badge`, `tagline`, `description`, `colorScheme`, `style`, `layout`, `fontSize` |

Each built-in preset has its own typography style:

| Preset | Style | Headings / body |
| --- | --- | --- |
| `hakushi` | `sans` | Plus Jakarta Sans / Inter |
| `paper` | `literary` | Fraunces / Lora |
| `academic` | `monograph` | Source Sans 3 / Source Serif 4 |
| `refined` | `editorial` | Playfair Display / Source Serif 4 |
| `earth` | `organic` | Alegreya / Alegreya Sans |
| `social` | `geometric` | Space Grotesk / DM Sans |

Fonts load only when they're used. A style's `stylesheet` is linked when the style is active (the page's no-flash script adds it before first paint), and every style's fonts load when the reader opens the theme picker's advanced options, so the typography cards can preview them. Fonts named in `fontHeading`, `fontBody` or `fontCode` must be loaded by the style's `stylesheet` (or be installed locally). Font fields you leave out are inherited from the base style (`sans` for a new style), and so is that style's stylesheet, which is kept alongside yours.

`theme.colorScheme`, `style`, `layout`, and `fontSize` choose the defaults for new visitors. `theme.preset` applies a preset's choices as defaults; an explicit default overrides the preset's value. A preset field you leave out uses the default. An unknown id or color name stops the build with an error that lists the valid choices. If a visitor saved a choice that has since been removed, the configured default is used instead. **Reset** in the picker returns to the configured defaults.

The page root carries `data-scheme`, `data-style`, `data-layout`, `data-font-size`, and `data-preset` attributes, so `customCss` can target a choice, for example `html[data-preset="acme"] .md-body h1 { letter-spacing: -0.02em; }`.

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

The interactive theme picker writes the color, font, and layout tokens inline, so they take precedence over this file. To change those, configure a [custom theme](#custom-themes). The site is locked to one look unless you offer more choices (see [What the picker offers](#custom-themes)); to remove the picker entirely, use a custom header.

## Override components

Component paths are relative to the consuming project:

```js
hakushi({
  components: {
    Header: './src/components/DocsHeader.astro',
    ArticleView: './src/components/ArticleView.astro',
    AboutPage: './src/components/About.astro',
    CollectionPage: './src/components/CollectionPage.astro',
  },
})
```

| Component | Contract |
| --- | --- |
| `BaseLayout` | `title?`, `description?`, default slot |
| `Header` | `view?: 'reader' \| 'graph'` |
| `ArticlePage` | `entry` |
| `AboutPage` | `about` (`title`, `description`, `content`), `collections`, `articleCount` |
| `ReaderShell` | `entry?`, `currentCollection?`, `headings?`, `subgraph?`, `isGraphPage?`, `isAboutPage?`, default slot |
| `ArticleView` | `entry`, `Content`, `headings`, `readingTime`, `backlinks` |
| `CollectionPage` | `collection`, `articles` |
| `Footer` | none; read `footer` from `virtual:hakushi/config` |

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

Keys are `home`, `articles`, `collections`, `aliases`, `graph`, `tags`, `categories`, `about`, and `notFound`. Disabling `home`, for example, lets the project keep `src/pages/index.astro`.

## Markdown features

- `[[wikilinks]]` and `[[target|custom labels]]`
- `:::note`, `tip`, `warning`, `danger`, `info`, `quote`, and `check` callouts
- `:::tab` groups
- Mermaid, chart, and ABC music notation fences
- Math through `remark-math` and MathJax
- Code titles such as ```` ```ts title="example.ts" ````

Hakushi owns the unified Markdown processor. Take care not to replace `markdown.processor` when adding more Markdown configuration.

## Read aloud

Articles show a **Listen** control in their metadata line. It reads the title, summary and body aloud using the browser's built-in speech synthesis (the Web Speech API), in the site's `lang`, highlighting each block as it is spoken. While reading, it turns into pause/resume and stop icons, and the same controls appear beside the scroll-to-top button, which sits at the bottom of the screen in line with the article's right edge once the page is scrolled down. Reading follows along by scrolling until you scroll yourself, and picks up again when the spoken block is back on screen. Code blocks, diagrams, charts, music notation, tables and display math are skipped; inline math is read as "formula". The control only appears in browsers that support speech synthesis. Set `readAloud: false` to remove it.

## Favicon, footer and 404 page

**Favicon.** Without a `favicon` option, pages use the built-in Hakushi icon. Set it to a URL (usually a file in your `public/` folder), an object with `href` and optional `type`, `sizes` and `rel`, or an array of them. The MIME type is inferred from the file extension. `favicon: false` adds no icon link.

```js
hakushi({
  favicon: [
    '/favicon.svg',
    { href: '/favicon-32.png', sizes: '32x32' },
    { href: '/apple-touch-icon.png', rel: 'apple-touch-icon', sizes: '180x180' },
  ],
})
```

**Footer.** `footer` adds a bar at the bottom of every page with `left`, `middle` and `right` text. On narrow screens the three columns stack, centered. Inside the text, `[label](href)` makes a link (absolute URLs open in a new tab), `{year}` is replaced with the build year and `{title}` with the site title. Any other text, HTML included, is shown as written. The footer is off by default, and isn't shown when all three are empty. To change its markup, replace the `Footer` component (see "Override components").

**404 page.** `notFound.title` is the large heading on the built-in 404 page and is also used in its browser title (default `404`); `notFound.text` is the message below it, with blank lines separating paragraphs (default `No note found at this path.`).

## Google Analytics

Set `googleAnalytics` to a Google Analytics 4 measurement ID to add the Google tag (`gtag.js`) to every page:

```js
hakushi({ googleAnalytics: 'G-XXXXXXXXXX' })
```

It is off by default. The tag is only added to production builds (`astro build`), so `astro dev` traffic isn't counted. Each page load is reported as a page view. An ID that isn't a Google tag ID (`G-…`) stops the build with an error. Hakushi doesn't show a cookie-consent banner; if your audience requires one, add it with a custom header or component and configure [Google consent mode](https://developers.google.com/tag-platform/security/guides/consent).

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `/` | Open search |
| `Ctrl` `K` / `⌘` `K` | Open or close search |
| `↑` `↓` | Move through search results |
| `Enter` | Open the selected search result |
| `Esc` | Close search or the mobile navigation drawer |
| `\` | Hide or show both sidebars (desktop widths) |

`/` and `\` are ignored while typing in a text field, so both characters can still be typed. `\` hides both sidebars when either one is showing and shows both when both are hidden; the panel buttons at either end of the header toggle each sidebar on its own. Sidebar state is remembered per browser.

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
