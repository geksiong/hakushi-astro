---
title: Rhythm Grids
collection: docs
category: Markdown Demos
tags: [markdown, demo, music, rhythm]
author: Hakushi
summary: Turn column-aligned count grids into box notation and clock-face cycles, with percussion playback.
---

A `rhythm-grid` fence turns a grid typed for a monospaced font into box notation. The first line holds the counts, and every other row is matched to them by character position. `|` in the header marks a group boundary.

## Counts and accents

```rhythm-grid
Subdivision:   1  2  3  4  5  6  7  8
Tresillo:      X  .  .  X  .  .  X  .    (3 + 3 + 2)
Backbeat:      .  .  x  .  .  .  x  .
```

`X` is strong, `x` light, `o` muted, `.` empty and `-` held from the previous cell. Anything else is shown as text, and words separated by single spaces span the columns they sit over:

```rhythm-grid
Count:    7   8   9  10  11  12 | 1   2   3
Guitar:   .   F   .   E   .   . | E   -   x
Meaning:             arrive       next cycle
```

## Playback

Give a grid a `tempo` to get playback controls. The sounding column is highlighted, and a woodblock counts in and keeps time: high on counts named like the first, low on the others. `play` picks the rows: semicolons play them in turn, commas together.

```{.rhythm-grid title="Soleá accents" tempo=150 play="Map A; Map B" repeat=2}
Count:   12  1  2 | 3  4  5 | 6  7 | 8  9 |10 11
Map A:    X  .  . | X  .  . | X  . | X  . | X  .
Map B:    X  .  . | X  .  . | .  X | X  . | X  .
```

`sound` picks General MIDI percussion for every row or per row, and unnumbered columns such as `&` split their count:

```{.rhythm-grid title="Son clave over a bass drum" tempo=96 sound="Clave=claves, Bass=bass-drum" count-in=4}
Count:  1 & 2 & 3 & 4 & | 1 & 2 & 3 & 4 &
Clave:  X . . X . . X . | . . X . X . . .
Bass:   x . . . x . . . | x . . . x . . .
```

## Cycles

Add `.circle` to draw a cycle as a clock face, one ring per row, with the first count at the top:

```{.rhythm-grid .circle title="Soleá landmarks" tempo=150}
Count:    12  1  2 | 3  4  5 | 6  7 | 8  9 |10 11
Accents:   X  .  . | X  .  . | X  . | X  . | X  .
Guitar:    .  .  . | x  .  . | x  . | .  x | .  x
```

Every grid also gets a spoken description for screen readers. For melodies and chords, see [ABC notation](../blog/2026-08-23-abc-notation.md) and [Fretboard Diagrams](fretboard-diagrams.md).
