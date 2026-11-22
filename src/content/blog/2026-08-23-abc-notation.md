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

## Plain Code Blocks Still Work

Any other language tag renders as a normal highlighted code block:

```
X:1
T:this stays a plain code block
M:4/4
K:C
C D E F
```
