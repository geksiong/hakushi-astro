---
title: ABC Renderers
collection: docs
category: Markdown Demos
tags: [markdown, demo, music, abc]
author: Hakushi
summary: The same ABC notation engraved by abcjs and by abc2svg, and the extras only abc2svg draws, such as jianpu.
---

Hakushi engraves ABC notation with one of two libraries, depending on the fence's language tag:

| Fence | Renderer | Best for |
| --- | --- | --- |
| ```` ```abc ```` | [abcjs](https://www.abcjs.net/) | Standard notation with playback: play/pause, loop, tempo and note highlighting |
| ```` ```abc2svg ```` | [abc2svg](https://chiselapp.com/user/moinejf/repository/abc2svg) | abcm2ps-style engraving and its extensions: jianpu, Clairnote, string tablature, chord diagrams |

Both read the same ABC source, so you can switch a score from one to the other by changing the tag. abc2svg blocks are display-only: they have no playback controls. Its extensions load the first time a tune uses their `%%` directive, and the renderer itself is fetched only on pages that have an `abc2svg` block.

## The same tune, two renderers

With plain ABC both renderers give you a standard score. They differ in layout and typography: abcjs fits the score to the column, while abc2svg lays the music out on a page width and scales it down to fit.

```abc
X:1
T:Ode to Joy (abcjs)
C:Ludwig van Beethoven
M:4/4
L:1/4
K:G
B B c d | d c B A | G G A B | B>A A2 |
B B c d | d c B A | G G A B | A>G G2 |]
```

```abc2svg
X:1
T:Ode to Joy (abc2svg)
C:Ludwig van Beethoven
M:4/4
L:1/4
K:G
B B c d | d c B A | G G A B | B>A A2 |
B B c d | d c B A | G G A B | A>G G2 |]
```

## Jianpu (numbered notation)

`%%jianpu 1` turns the score into [jianpu](https://en.wikipedia.org/wiki/Numbered_musical_notation) (简谱): scale degrees as numbers, the key and metre as a `1=F 2/4` heading, underlines for shorter notes, dashes for held beats and dots for other octaves. abcjs doesn't know the directive, so it ignores it and draws a staff.

**abc2svg:**

```abc2svg
X:2
T:Mo Li Hua (opening)
C:Chinese folk song
%%jianpu 1
M:2/4
L:1/16
K:F
A2Ac dffd | c2cd c4 | A2Ac dffd | c2cd c4 |
c4 c2Ac | d4 c4 | A2GA c2AG | F2FG F4 |]
```

**abcjs, same source:**

```abc
X:2
T:Mo Li Hua (opening)
C:Chinese folk song
%%jianpu 1
M:2/4
L:1/16
K:F
A2Ac dffd | c2cd c4 | A2Ac dffd | c2cd c4 |
c4 c2Ac | d4 c4 | A2GA c2AG | F2FG F4 |]
```

### Staff and jianpu together

`%%jianpu` can also apply to a single voice. Here the melody is written twice, once on a staff and once as jianpu, which is handy when teaching one notation through the other:

```abc2svg
X:3
T:Ode to Joy, staff and jianpu
%%score 1 2
M:4/4
L:1/4
K:G
V:1 name="Staff"
V:2 name="Jianpu"
%%jianpu 1
[V:1] B B c d | d c B A | G G A B | B>A A2 |
[V:2] B B c d | d c B A | G G A B | B>A A2 |
```

## Clairnote

`%%clairnote 1` engraves the score in [Clairnote](https://clairnote.org/), an alternative staff whose line pattern repeats every octave, so an interval or chord looks the same wherever it sits, in any key.

```abc2svg
X:4
T:Ode to Joy in Clairnote
%%clairnote 1
M:4/4
L:1/4
K:G
B B c d | d c B A | G G A B | B>A A2 |]
```

## String tablature

`%%strtab` in a voice turns it into tablature for the strings listed, lowest first, in ABC pitches (`E,A,DGBe` is standard guitar tuning). Fret numbers are worked out from the notes:

```abc2svg
X:5
T:Arpeggios with tablature
%%score 1 2
M:4/4
L:1/8
K:Am
V:1
V:2
%%strtab E,A,DGBe
[V:1] A,CEA cAEC | G,B,DG BGDB, | F,A,CF AFCA, | E,^G,B,E B,^G,E,2 |]
[V:2] A,CEA cAEC | G,B,DG BGDB, | F,A,CF AFCA, | E,^G,B,E B,^G,E,2 |]
```

## Chord diagrams

`%%diagram 1` draws a guitar chord box above each chord symbol:

```abc2svg
X:6
T:Chord diagrams
%%diagram 1
M:4/4
L:1/4
K:C
"C" c e g e | "Am" A c e c | "F" F A c A | "G" G B d2 |]
```

## Which one to use

- Use `abc` when readers should hear the tune: abcjs adds playback controls and highlights notes as they sound.
- Use `abc2svg` when you need something abcjs doesn't draw, such as jianpu, Clairnote, tablature from `%%strtab`, chord diagrams, or other abcm2ps formatting directives.
- Only `abc` scores can be listening items (```` ```{.abc .listen} ````) or swing in playback, because both need the player. See [[ear-training|Ear Training and Swing]].
