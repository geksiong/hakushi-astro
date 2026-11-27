---
title: Sheet Music with ABC Notation
category: Music
tags: [music, notation, abc, demo]
date: 2026-08-23
author: Hakushi
summary: A demonstration of rendering sheet music inline from ABC notation code fences.
---

Fences tagged with `abc` are rendered as engraved sheet music instead of code. The header pulls its title from the tune's `T:` field.

Each score has playback controls underneath: play/pause, loop, restart, a seekable progress bar, and a tempo field. Notes are highlighted as they sound, and starting one tune pauses any other that is playing. The instrument samples are fetched on first play from the abcjs soundfont CDN.

## Ode to Joy

```abc
X:1
T:Ode to Joy
C:Ludwig van Beethoven
M:4/4
L:1/4
K:G
B B c d | d c B A | G G A B | B>A A2 |
B B c d | d c B A | G G A B | A>G G2 |
A A B G | A B/c/ B G | A B/c/ B A | G A D2 |
B B c d | d c B A | G G A B | A>G G2 |]
```

## Greensleeves

Chord symbols and repeat markers are supported:

```abc
X:2
T:Greensleeves
C:Traditional
M:6/8
L:1/8
K:Am
A |: "Am" c2 d e>fe | "G" d2 B G>AB | "Am" c2 A A>^GA | "E" B2 ^G E2 A |
"Am" c2 d e>fe | "G" d2 B G>AB | "Am" c>BA "E" ^G>^F^G | "Am" A3- A2 :|
```

## Swing

`%%MIDI swing 66` swings a score's offbeat eighths 2:1 when it plays; `60` is a lighter 3:2 and `50` keeps it straight. Only X/4 meters swing, and only where a beat holds two eighths. Set a default for every score with the integration's `abc: { swing: 66 }` option.

```abc
X:1
T:Swung Eighths
M:4/4
L:1/8
Q:1/4=120
%%MIDI swing 66
K:F
"F7" FGAc d2 cA | "Bb7" BAGF D2 F2 | "F7" FGAc d2 cA | "C7" GFED C4 |]
```

## Listening Items

Mark a fence `{.abc .listen}` for an ear-training question whose notation would give the answer away. It keeps its title and player, but the score is not shown.

```{.abc .listen}
X:1
T:Ear Test: Which Interval?
M:4/4
L:1/4
Q:1/4=72
K:C
C2 G2 | [CG]4 |]
```

::: hint
Count the letter names from the lower note to the upper one.
:::

::: solution
A perfect fifth: C up to G.
:::

## Plain Code Blocks Still Work

Any other language tag renders as a normal highlighted code block:

```
X:1
T:this stays a plain code block
M:4/4
K:C
C D E F
```
