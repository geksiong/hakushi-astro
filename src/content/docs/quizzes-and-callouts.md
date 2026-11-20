---
title: Quizzes and Callouts
collection: docs
category: Markdown Demos
tags: [markdown, demo, quizzes, callouts]
author: Hakushi
summary: Try an interactive knowledge check and the additional LibroMorph-style callout types.
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

## Copy this pattern

~~~md
::: quiz
**Question:** What does a checked item mark?

- [ ] A heading
- [x] The correct answer

*Explanation:* The checked item is the answer.
:::
~~~
