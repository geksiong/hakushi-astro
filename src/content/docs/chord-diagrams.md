---
title: Chord Diagrams
collection: docs
category: Markdown Demos
tags: [markdown, demo, music, guitar]
author: Hakushi
summary: Render guitar and ukulele chord shapes from compact Markdown code fences.
---

A `chord` fence draws one or more fretboard shapes as SVG. Each line is a chord name followed by fret positions from the lowest string to the highest. Use `x` for a muted string and `0` for an open string.

## Common guitar shapes

```chord
C x32010 fingers=x32010
G 320003 fingers=210003
F 133211 fingers=134211
```

## Four strings and higher frets

The number of fret positions determines the number of strings. Commas allow fret numbers above nine.

```chord
C 0003
A x,12,14,14,14,12 fingers=x,1,3,3,3,1
```

Add `base=N` to choose the top fret shown in a diagram, or `barre=N` to draw a barre at that fret. Finger numbers shared across strings on the same fret also make a barre.

## Authoring syntax

~~~md
```chord
C x32010 fingers=x32010
G 320003 fingers=210003
```
~~~

For sheet music, see [[2026-08-23-abc-notation|ABC Notation]].
