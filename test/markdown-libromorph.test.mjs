import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkInline from '../src/plugins/remark-libromorph-inline.mjs';
import remarkChords from '../src/plugins/remark-chords.mjs';
import remarkIndexTerms from '../src/plugins/remark-index-terms.mjs';
import remarkFretboards from '../src/plugins/remark-fretboards.mjs';
import { scanIndexMarkers } from '../src/lib/term-index.mjs';
import rehypeEnhancer from '../src/plugins/rehype-enhancer.mjs';

const processor = await createMarkdownProcessor({
	remarkPlugins: [remarkIndexTerms, remarkInline, remarkChords, remarkFretboards],
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

test('renders drop caps and vertical writing sections', async () => {
	const { code } = await processor.render('[A]{.dropcap} beginning.\n\n::: vertical\n{漢字|かんじ}と{tcy:42}\n:::');
	assert.match(code, /<span class="dropcap">A<\/span>/);
	assert.match(code, /class="writing-mode-block writing-mode-vertical"/);
	assert.match(code, /<ruby>漢字/);
	assert.match(code, /<span class="tcy">42<\/span>/);
});

test('renders chord fences as accessible SVG diagrams and handles invalid input', async () => {
	const { code } = await processor.render('```chord\nC x32010 fingers=x32010\nF 133211 fingers=134211\n```');
	assert.match(code, /class="chord-diagrams"/);
	assert.equal((code.match(/class="chord-svg"/g) ?? []).length, 2);
	assert.match(code, /aria-label="C chord diagram"/);
	const invalid = await processor.render('```chord\nC x32?10\n```');
	assert.match(invalid.code, /Could not draw chord diagram/);
	assert.doesNotMatch(invalid.code, /class="chord-svg"/);
});

test('index references point to the anchors generated in article HTML', async () => {
	const markdown = '[word]{.index} and [phrase]{.index entry="Parent!Child"} and {index: "word"}.\n\n`[code]{.index}`\n\n```md\n[code]{.index}\n```';
	const references = scanIndexMarkers(markdown);
	assert.deepEqual(references.map((reference) => reference.term), ['word', 'Parent!Child', 'word']);
	const { code } = await processor.render(markdown);
	for (const reference of references) assert.match(code, new RegExp(`id="${reference.anchor}"`));
	assert.doesNotMatch(code, /id="idx-code/);
});

test('fretboard fences preserve render input and show invalid JSON errors', async () => {
	const good = await processor.render('```fretboard\n{"title":"Exercise","dots":[{"string":6,"fret":5}]}\n```');
	assert.match(good.code, /data-fret-kind="fretboard"/);
	assert.match(good.code, /data-fret-source="\{&#x22;title&#x22;:/);
	const bad = await processor.render('```fretboard\n{not-json}\n```');
	assert.match(bad.code, /Could not draw fretboard/);
	const fretdrom = await processor.render('```fretdrom\n{scale:{name:"A"}}\n```');
	assert.match(fretdrom.code, /data-fret-kind="fretdrom"/);
});
