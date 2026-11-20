---
title: Indexed Terms
collection: docs
category: Markdown Demos
tags: [markdown, demo, index]
author: Hakushi
summary: Mark terms in Markdown and browse their exact article locations from the Term Index.
---

An [index entry]{.index} marks visible text. Visit the [Term Index](/terms) to find each occurrence and follow a link back to this sentence.

You can index a phrase under a different name, such as [furigana]{.index entry="Japanese!Furigana"}. The exclamation mark separates levels in the index label.

An invisible marker also works here: {index: "Markdown!Invisible marker"} it creates a link target without changing the surrounding prose.

## Authoring syntax

~~~md
[index entry]{.index}
[furigana]{.index entry="Japanese!Furigana"}
{index: "Markdown!Invisible marker"}
~~~

Markers inside code examples stay plain text. Related demos cover [[ruby-and-upright-text|Ruby Text and Upright Numbers]] and [[quizzes-and-callouts|Quizzes and Callouts]].
