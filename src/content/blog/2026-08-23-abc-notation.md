---
title: Sheet Music with ABC Notation
category: Music
tags: [music, notation, abc, demo]
date: 2026-08-23
author: Hakushi
summary: A demonstration of rendering sheet music inline from ABC notation code fences.
---

Fences tagged with `abc` are rendered as engraved sheet music instead of code. The header pulls its title from the tune's `T:` field.

## Ode to Joy

```abc
X:1
T:Ode to Joy
C:Ludwig van Beethoven
M:4/4
L:1/4
K:G
G G A B | B A G F | E E F G | G3 F |
G G A B | B A G F | E E F G | F3 E |
```

## Greensleeves

Chord symbols and repeat markers are supported:

```abc
X:2
T:Greensleeves
M:6/8
L:1/8
K:Am
|:"Am" A2 c "G" e2 d|"Em" B2 G "E" E2 D|
"Am" A2 c "G" e2 d|"A" cBA "E" B2 :|
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
