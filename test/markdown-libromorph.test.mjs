import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkInline from '../src/plugins/remark-libromorph-inline.mjs';
import rehypeEnhancer from '../src/plugins/rehype-enhancer.mjs';

const processor = await createMarkdownProcessor({
	remarkPlugins: [remarkInline],
	rehypePlugins: [rehypeEnhancer],
	syntaxHighlight: false,
});

test('renders LibroMorph inline syntax without interpreting code', async () => {
	const { code } = await processor.render('花は{漢字|かんじ}、[東京]{.ruby ruby="とうきょう"}、{tcy:42}、[38]{.tcy}。 `\{猫|ねこ\}`');
	assert.match(code, /<ruby>漢字<rp>\(<\/rp><rt>かんじ<\/rt><rp>\)<\/rp><\/ruby>/);
	assert.match(code, /<ruby>東京<rp>\(<\/rp><rt>とうきょう<\/rt>/);
	assert.match(code, /<span class="tcy">42<\/span>/);
	assert.match(code, /<span class="tcy">38<\/span>/);
	assert.match(code, /<code>\{猫\|ねこ\}<\/code>/);
});

test('renders quiz answers, explanation, and new callouts', async () => {
	const markdown = `::: quiz
**Question:** Which answer is correct?

- [ ] First
- [x] Second

*Explanation:* Second is correct.
:::

::: theorem
This is a theorem.
:::`;
	const { code } = await processor.render(markdown);
	assert.match(code, /class="quiz-card"/);
	assert.match(code, /data-correct="true"/);
	assert.match(code, /Correct answer: Second/);
	assert.match(code, /Second is correct/);
	assert.match(code, /class="callout callout-theorem"/);
});

test('keeps a quiz with ambiguous answers visible instead of creating a broken control', async () => {
	const { code } = await processor.render('::: quiz\nChoose one.\n\n- [x] First\n- [x] Second\n:::');
	assert.doesNotMatch(code, /class="quiz-card"/);
	assert.match(code, /First/);
	assert.match(code, /Second/);
});
