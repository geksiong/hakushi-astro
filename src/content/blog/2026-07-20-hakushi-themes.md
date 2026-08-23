---
title: Designing Hakushi Color Schemes & Themes
collection: blog
category: Design Systems
tags: [design, css, hakushi, themes, ui-ux]
date: 2026-07-20
author: Marcus Vance
summary: How Hakushi uses dynamic CSS custom properties for instant scheme and typography switching with zero layout shift.
---

# Designing Hakushi Color Schemes & Themes

Creating an appealing documentation workspace requires balance between readability, mathematical color contrast, and expressive aesthetic options.

:::info
**Theme Architecture Concept**
In Hakushi, **Color Schemes** define color palettes (Primary, Accent, Backgrounds, Borders) while **Themes** dictate typography, border radii, and visual layout density.
:::

## The 6 Color Palettes

We have crafted 6 distinct color schemes engineered to meet **WCAG 2.1 AA contrast standards**:

1. **Hakushi Cosmic**: Deep indigo & electric cyan (Astro default).
2. **Obsidian Emerald**: Forest green & mint glow (Obsidian vibe).
3. **Nord Arctic**: Cool blue & slate ice.
4. **Amber Sunset**: Warm terracotta & golden amber.
5. **Monokai Matrix**: High-contrast dark cyber teal.
6. **Rosé Pine**: Warm dusky pink & soft lavender.

```css title="src/styles/theme-tokens.css"
/* Dynamic Theme Variable Mapping */
:root {
  --primary: #6366f1;
  --accent: #06b6d4;
  --font-heading: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Inter', sans-serif;
  --radius: 0.5rem;
}

.dark {
  --primary: #818cf8;
  --bg-main: #0b0f19;
  --bg-surface: #131b2e;
}
```

---

## Typography Presets

:::check
- **Hakushi Sans**: Modern geometric sans-serif for developer speed.
- **Academic Serif**: High-elegance display headings paired with math-focused body text.
- **Developer Mono**: Pure monospaced aesthetic for code-heavy documentation.
- **Editorial Modern**: High-contrast sans headings with warm editorial serif body text.
:::

## Related Reading
- Return to [[getting-started|Getting Started Guide]].
- Read [[riemann-hypothesis|Mathematical Foundations]].
