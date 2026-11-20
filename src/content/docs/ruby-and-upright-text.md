---
title: Ruby Text and Upright Numbers
collection: docs
category: Markdown Demos
tags: [markdown, demo, typography, japanese]
author: Hakushi
summary: See LibroMorph-style furigana and upright number syntax rendered in a Hakushi article.
---

Ruby annotations place a pronunciation beside a word. The compact form `{base|reading}` works directly in a paragraph: {漢字|かんじ} and {東京|とうきょう}.

The Pandoc-style span form renders the same semantic HTML: [日本語]{.ruby ruby="にほんご"} and [花間]{.ruby ruby="huā jiān"}. The reading can contain spaces.

## Upright text

Tate-chū-yoko keeps a short number upright when its paragraph is displayed in vertical writing. Both {tcy:42} and [2026]{.tcy} produce an upright-text span. In Hakushi's normal horizontal article layout, the numbers remain in the usual reading flow.

## Authoring syntax

~~~md
{漢字|かんじ}
[日本語]{.ruby ruby="にほんご"}
{tcy:42}
[2026]{.tcy}
~~~

These forms are parsed in prose. An inline code example such as `{猫|ねこ}` remains code.

For interactive Markdown, continue to [[quizzes-and-callouts|Quizzes and Callouts]].

## Writing-mode sections and initials

[A]{.dropcap} drop cap can open a paragraph without writing HTML. The first letter in this paragraph uses that span syntax.

The next block runs from top to bottom and columns advance from right to left. Its numbers use the same upright-text notation shown above.

::: vertical
{吾輩|わがはい}は{猫|ねこ}である。{tcy:42}匹の猫ではない。

縦書きの中でも [2026]{.tcy} は短い横書きとして表示される。
:::

Use `::: horizontal` for a horizontal section inside a vertical writing context.
