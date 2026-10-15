---
title: "RFC 001: Knowledge Graph Engine Specification"
collection: specs
category: Architecture
tags: [spec, rfc, graph, d3, architecture]
date: 2026-07-25
author: System Architect
summary: Technical specification for real-time D3 force simulation, node clustering, and local sub-graph article previews.
---

## Status: ACCEPTED

This RFC outlines the architectural specification for Hakushi's interactive knowledge graph engine.

:::tip
**Design Goals**
- Render up to 5,000 nodes at 60 FPS in browser canvas or SVG.
- Support multi-hop link expansion on hover.
- Automatically construct links from explicit `[[WikiLinks]]`, tags, and categories.
:::

## Node Weight Calculation Table

| Node Type | Base Radius | Color Token | Collision Radius |
| :--- | :--- | :--- | :--- |
| **Article** | 8px | `var(--primary)` | 18px |
| **Category** | 12px | `var(--accent)` | 26px |
| **Tag** | 6px | `var(--secondary)` | 14px |
| **Keyword** | 4px | `var(--text-muted)` | 10px |

---

## Force Physics Configuration

```typescript title="src/lib/graphPhysics.ts"
import * as d3 from 'd3';

export function createGraphSimulation(nodes: any[], links: any[], width: number, height: number) {
  return d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d: any) => d.id).distance(60))
    .force('charge', d3.forceManyBody().strength(-120))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius((d: any) => d.val + 8));
}
```

## Related Specs & Docs
- See [[getting-started|Getting Started Overview]].
- Read [[neural-symbolic|Neural Symbolic AI Reference]].
