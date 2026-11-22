---
title: Fretboard Diagrams
collection: docs
category: Markdown Demos
tags: [markdown, demo, music, guitar]
author: Hakushi
summary: Draw guitar scales, marked positions, and Fretdrom scale boxes from Markdown fences.
---

Use a `fretboard` fence with JSON to draw either a named scale or specific notes on the neck. The default tuning is standard six-string guitar, listed low to high.

## Named scale

Scale dots show their note names, with the root in red. The thicker 12th fret marks the octave.

```fretboard
{"title":"A minor pentatonic","fretCount":12,
 "scale":{"root":"A","type":"minor pentatonic"}}
```

## Marked positions

String `1` is the high string. A dot's `label` can show playing order or fingering.

```fretboard
{"title":"Ascending exercise","fretCount":8,
 "dots":[{"string":6,"fret":5,"label":"1"},
         {"string":6,"fret":8,"label":"2"},
         {"string":5,"fret":5,"label":"3"}]}
```

## Fretdrom scale box

`fretdrom` fences accept Fretdrom's JSON5 notation for compact boxes and tablature.

```fretdrom
{scale:{name:"A minor pentatonic",start_fret:5,num_frets:4,
 grid:[["R",".",".","x"],["x",".","x","."],
       ["x",".","x","."],["x",".","x","."],
       ["x",".",".","x"],["R",".",".","x"]]}}
```

For compact chord shapes, see [[chord-diagrams|Chord Diagrams]].
