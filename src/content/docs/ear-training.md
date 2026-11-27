---
title: Ear Training and Swing
collection: docs
category: Markdown Demos
tags: [markdown, demo, music, abc, exercises]
author: Hakushi
summary: Listening items that play without showing their notation, folded hints and solutions, score anchors, and swung playback.
---

This page puts LibroMorph's exercise syntax together: ABC scores that play without showing their notation, hints and solutions that stay folded until opened, and swing in playback. For the plain callout and quiz syntax, see [[quizzes-and-callouts|Quizzes and Callouts]].

## Listen and answer

Press play on each question, decide, then open the hint or the solution. The scores are hidden because they would give the answer away. Jump straight to [question 2](#ear-chord) or [question 3](#ear-cadence): `{#id .abc}` gives a score an anchor.

1. Which interval do you hear, first melodically and then as one chord?

   ```{#ear-interval .abc .listen}
   X:1
   T:Question 1: Interval
   M:4/4
   L:1/4
   Q:1/4=72
   K:C
   C2 E2 | [CE]4 |]
   ```

   ::: hint
   Sing up from the lower note: how many letter names do you pass?
   :::

   ::: solution
   A **major third**, C up to E: four semitones.
   :::

2. Is this triad major or minor?

   ```{#ear-chord .abc .listen}
   X:1
   T:Question 2: Chord Quality
   M:4/4
   L:1/4
   Q:1/4=72
   K:C
   A, C E2 | [A,CE]4 |]
   ```

   ::: hint Listen to the middle note
   A minor triad's middle note sits a semitone lower than a major triad's, which makes it sound darker.
   :::

   ::: {.solution title="Answer: minor"}
   **A minor**: A, C and E. From the root, the third is three semitones (minor) and the fifth seven.
   :::

3. Which cadence ends this phrase?

   ```{#ear-cadence .abc .listen}
   X:1
   T:Question 3: Cadence
   M:4/4
   L:1/4
   Q:1/4=66
   K:C
   [CEG]2 [FAc]2 | [G,B,DF]4 | [CEGc]4 |]
   ```

   ::: hint
   Is the last move from the dominant (V) or the subdominant (IV)?
   :::

   ::: {.solution #cadence-answer title="Answer and analysis"}
   A **perfect cadence**, V⁷–I. The seventh of G⁷ (F) falls to E and the leading tone (B) rises to C:

   | Chord | Notes      | Function |
   | ----- | ---------- | -------- |
   | G⁷    | G B D F    | V⁷       |
   | C     | C E G c    | I        |

   :::

## A worked example

Add `open` to a reveal to start it expanded, for an example the reader should see right away. It still folds when clicked.

::: {.solution title="Worked example: naming an interval" open}
To name C up to G:

1. Count the letter names, including both ends: C D E F G is **five**, a fifth.
2. Count the semitones: 7. A fifth with seven semitones is **perfect**.

$$\text{semitones}(C \to G) = 7 \Rightarrow \text{P5}$$

:::

## Swing

The same line three times. Press play on each: the offbeat eighths move later as the swing grows. `%%MIDI swing N` sets the percentage of each beat that the first eighth takes. Only X/4 meters swing, and only where a beat holds two eighths, so the quarter notes at the end of each line don't move.

```{#swing-straight .abc}
X:1
T:Straight (swing 50)
M:4/4
L:1/8
Q:1/4=132
%%MIDI swing 50
K:F
"F7" FGAc d2 cA | "Bb7" BAGF D2 F2 | "F7" FGAc d2 cA | "C7" GFED C2 z2 |]
```

```{#swing-light .abc}
X:1
T:Light Swing, 3:2 (swing 60)
M:4/4
L:1/8
Q:1/4=132
%%MIDI swing 60
K:F
"F7" FGAc d2 cA | "Bb7" BAGF D2 F2 | "F7" FGAc d2 cA | "C7" GFED C2 z2 |]
```

```{#swing-hard .abc}
X:1
T:Triplet Swing, 2:1 (swing 66)
M:4/4
L:1/8
Q:1/4=132
%%MIDI swing 66
K:F
"F7" FGAc d2 cA | "Bb7" BAGF D2 F2 | "F7" FGAc d2 cA | "C7" GFED C2 z2 |]
```

To swing every score on a site, set a default in `astro.config.mjs`. A score's own `%%MIDI swing 50` keeps it straight:

```js
hakushi({ abc: { swing: 66 } })
```

## Copy these patterns

Inside a list item, indent the fences to the item's content column: three spaces after `1. `, four after `10. `.

~~~md
1. Which interval do you hear?

   ```{#q1 .abc .listen}
   X:1
   T:Question 1
   M:4/4
   L:1/4
   K:C
   C2 E2 | [CE]4 |]
   ```

   ::: hint
   Count the letter names.
   :::

   ::: {.solution title="Answer" open}
   A major third.
   :::
~~~

`.listen` needs playback, so it works on `abc` fences only. abc2svg scores (see [[abc-renderers|ABC Renderers]]) have no player.
