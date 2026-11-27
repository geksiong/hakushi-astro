---
title: Quizzes and Callouts
collection: docs
category: Markdown Demos
tags: [markdown, demo, quizzes, callouts]
author: Hakushi
summary: Try an interactive knowledge check, collapsible hints and solutions, and the additional LibroMorph-style callout types.
---

Choose an answer in each knowledge check. Hakushi shows feedback and keeps an answer reveal available beneath the choices.

## Knowledge checks

::: quiz
**Question:** Which Markdown marker identifies the correct answer?

- [ ] `- [ ]`
- [x] `- [x]`
- [ ] `::: note`

*Explanation:* A checked task-list item marks the single correct option.
:::

::: quiz Ruby and upright text
**Question:** Which notation adds a reading to the word 漢字?

- [x] `{漢字|かんじ}`
- [ ] `{tcy:漢字}`
- [ ] `[[漢字]]`

*Explanation:* The text before the bar is the base word; the text after it is the pronunciation. See [[ruby-and-upright-text|Ruby Text and Upright Numbers]] for a rendered example.
:::

## Hints and solutions

`::: hint` and `::: solution` stay folded until the reader opens them, so an exercise can be tried before looking. Everything inside is ordinary Markdown, including code and math. Give a custom label after the marker, or use the attribute form for a `title`, an `#id` or `open` to start expanded.

1. Reverse a singly linked list in place.

   ::: hint
   Save `next` before redirecting the link.
   :::

   ::: {.solution title="Solution and analysis"}
   Walk the list once with three references: `prev`, `current` and `next`. Point each node back at `prev`, then step forward. $O(n)$ time, $O(1)$ space.
   :::

2. What is $\sum_{k=1}^{n} k$?

   ::: hint Pair the terms
   Add the first and last terms, then the second and second-to-last.
   :::

Inside a list item, indent the fences to the item's content column: three spaces after `1. `, four after `10. `.

For hints and solutions paired with hidden-notation listening questions, see [[ear-training|Ear Training and Swing]].

~~~md
::: hint
Save `next` before redirecting the link.
:::

::: hint Pair the terms
A custom label.
:::

::: {.solution #reverse-answer title="Solution and analysis" open}
Starts expanded, with an anchor.
:::
~~~

## Callout types

::: theorem
**A simple identity.** For any number $x$, $x + 0 = x$.
:::

::: definition
**Ruby text** is a small annotation that gives a reading or pronunciation for nearby text.
:::

::: example
Use `{漢字|かんじ}` to annotate a word without writing HTML.
:::

::: caution
Mark exactly one quiz option with `[x]`. A quiz with no checked answer or multiple checked answers stays visible as its original Markdown content.
:::

## Attribute form

Any container also takes LibroMorph's attribute form, `::: {.type #id title="…"}`, so the same Markdown works in LibroMorph books. The `#id` becomes an anchor: [jump to this note](#attribute-note).

::: {.note #attribute-note title="Written with attributes"}
This note was opened with `::: {.note #attribute-note title="Written with attributes"}`.
:::

Containers work inside list items too, indented to the item's content column:

1. Install the dependencies.

   ::: {.tip title="Faster installs"}
   `pnpm install --frozen-lockfile` skips resolving and fails if the lockfile is stale.
   :::

2. Start the dev server.

   ::: warning
   Stop it with `astro dev stop` when you're done, or the port stays taken.
   :::

## Copy this pattern

~~~md
::: quiz
**Question:** What does a checked item mark?

- [ ] A heading
- [x] The correct answer

*Explanation:* The checked item is the answer.
:::
~~~
