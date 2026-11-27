import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkInline from '../src/plugins/remark-libromorph-inline.mjs';
import remarkChords from '../src/plugins/remark-chords.mjs';
import remarkIndexTerms from '../src/plugins/remark-index-terms.mjs';
import remarkFretboards from '../src/plugins/remark-fretboards.mjs';
import remarkRhythmGrids, { parseRhythmGrid, rhythmGridToAbc } from '../src/plugins/remark-rhythm-grids.mjs';
import remarkMdLinks from '../src/plugins/remark-md-links.mjs';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanIndexMarkers } from '../src/lib/term-index.mjs';
import rehypeEnhancer from '../src/plugins/rehype-enhancer.mjs';
import remarkAbc from '../src/plugins/remark-abc.mjs';

const processor = await createMarkdownProcessor({
	remarkPlugins: [remarkIndexTerms, remarkInline, remarkChords, remarkFretboards, remarkRhythmGrids],
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

test('rhythm grids become box-notation tables with spans, notes and a spoken description', async () => {
	const { code } = await processor.render(`\`\`\`rhythm-grid
Count:    7   8   9  10  11  12 | 1   2   3
Guitar:   .   F   .   E   .   . | E   -   x
Meaning:             arrive       next cycle
\`\`\`

\`\`\`rhythm-grid
Subdivision:     1 2 3 4 5 6
Two groups:      X . . X . .    (3 + 3)
\`\`\``);
	assert.equal((code.match(/<table class="rg-table">/g) ?? []).length, 2);
	assert.match(code, /<th class="rg-count rg-group-start" scope="col" data-col="6">1<\/th>/);
	assert.match(code, />F<\/td>/);
	assert.match(code, /rg-hold/);
	assert.match(code, /rg-light/);
	assert.match(code, /colspan="3"[^>]*>next cycle</);
	assert.match(code, /<td class="rg-note">\(3 \+ 3\)<\/td>/);
	assert.match(code, /Guitar: light on 3; held on 2; F on 8; E on 10, 1/);
	assert.match(code, /Two groups: strong on 1, 4/);
	assert.doesNotMatch(code, /data-rg-abc/);
});

test('rhythm grid descriptions name subdivisions and never merge empty markers', async () => {
	const sub = await processor.render('```rhythm-grid\nCount:  3 & 4 &\nB:      . x X .\n```');
	assert.match(sub.code, /B: strong on 4; light on 3&#x26;/);
	const typo = await processor.render('```rhythm-grid\nLocal count:  1 2 3 4 5 6\nCell A:      A . . Bb . Bb\n```');
	assert.match(typo.code, /Cell A: A on 1; Bb on 4, 6/);
	assert.doesNotMatch(typo.code, />A \.</);
});

test('rhythm grid circles, attributes and errors', async () => {
	const circle = await processor.render('```{.rhythm-grid .circle title="Cycle"}\nCount:    1  2  3 | 4  5  6 | 7  8 | 9 10 |11 12\nLandmark: .  .  X | .  .  X | .  X | .  X | .  X\n```');
	assert.match(circle.code, /class="rhythm-grid rhythm-grid-circle"/);
	assert.match(circle.code, /class="rg-circle-svg"/);
	assert.match(circle.code, /<p class="rg-title">Cycle<\/p>/);
	assert.match(circle.code, /Landmark: strong on 3, 6, 8, 10, 12/);
	const bad = await processor.render('```rhythm-grid\nCount: 1 2 3\nno label here\n```');
	assert.match(bad.code, /rhythm-grid-error/);
	assert.match(bad.code, /no label here/);
});

test('rhythm grids with a tempo carry a percussion tune mapped to their columns', async () => {
	const { code } = await processor.render('```{.rhythm-grid tempo=100}\nCount:  1 2 3 4\nHits:   X . x o\n```');
	assert.match(code, /data-rg-abc="X:1/);
	assert.match(code, /data-rg-columns="/);
	const grid = parseRhythmGrid('Count:   12  1  2 | 3  4  5 | 6  7 | 8  9 |10 11\nMap A:    X  .  . | X  .  . | X  . | X  . | X  .\nMap B:    X  .  . | X  .  . | .  X | X  . | X  .');
	const tune = rhythmGridToAbc(grid, { tempo: '100', play: 'Map A; Map B', repeat: '1', sound: 'Map B=claves' });
	assert.match(tune.abc, /Q:1\/4=100/);
	assert.match(tune.abc, /%%score \(V0 V1 V2\)/);
	// Count-in on 6–11 (the second half of a cycle shown from 12), woodblock low on counts not named 12.
	assert.match(tune.abc, /V:V0\n%%MIDI channel 10\n(!mp!f12 ){5}!mp!f12 \| !mf!e12 /);
	// Map A claps (^D,,) in the first cycle; Map B claves (^d) in the second.
	assert.match(tune.abc, /V:V1\n%%MIDI channel 10\n(z12 ){6}\| !fff!\^D,,12 z12 z12 !fff!\^D,,12/);
	assert.match(tune.abc, /V:V2\n%%MIDI channel 10\n[^\n]*\| !fff!\^d12 z12 z12 !fff!\^d12 z12 z12 z12 !fff!\^d12 /);
	// Every note and rest maps to a column.
	for (const [at, column] of Object.entries(tune.columns)) {
		assert.match(tune.abc.slice(Number(at)), /^ ?(!\w+!)?[\^a-gzA-G]/);
		assert.ok(column >= 0 && column < 12);
	}
	assert.deepEqual(rhythmGridToAbc(grid, { tempo: '100', play: 'Nope' }), { error: 'play= names rows not in the grid: nope' });
	assert.match(rhythmGridToAbc(grid, { tempo: '100', sound: 'kazoo' }).error, /unknown sound "kazoo"/);
	assert.equal(rhythmGridToAbc(grid, {}), null);
});

test('links to Markdown files become article URLs', async () => {
	const root = mkdtempSync(join(tmpdir(), 'hakushi-links-'));
	const docs = join(root, 'docs');
	mkdirSync(join(docs, 'Guides'), { recursive: true });
	mkdirSync(join(root, 'blog'));
	writeFileSync(join(docs, 'Guides', 'Getting Started.md'), '# Start');
	writeFileSync(join(docs, 'Guides', 'index.md'), '# Guides');
	writeFileSync(join(docs, 'custom.md'), '---\nslug: my-slug\n---\n# Custom');
	writeFileSync(join(root, 'blog', 'post.md'), '# Post');
	const links = await createMarkdownProcessor({
		remarkPlugins: [[remarkMdLinks, { collections: [{ id: 'docs', dir: docs }, { id: 'blog', dir: join(root, 'blog') }] }]],
		syntaxHighlight: false,
	});
	const markdown = '[a](Guides/Getting%20Started.md#setup) [b](./Guides/index.md) [c](custom.md) [d](../blog/post.md) [e](https://x.test/a.md) [f](notes.txt) [g][ref]\n\n[ref]: ../blog/post.md#top';
	const { code } = await links.render(markdown, { fileURL: new URL(`file://${join(docs, 'page.md')}`) });
	assert.match(code, /href="\/docs\/guides\/getting-started#setup"/);
	assert.match(code, /href="\/docs\/guides"/);
	assert.match(code, /href="\/docs\/my-slug"/);
	assert.match(code, /href="\/blog\/post"/);
	assert.match(code, /href="https:\/\/x.test\/a.md"/);
	assert.match(code, /href="notes.txt"/);
	assert.match(code, /href="\/blog\/post#top"/);
});

test('hint and solution blocks become collapsed reveals, also inside list items', async () => {
	const { code } = await processor.render(`::: hint
Save \`next\` first.
:::

1. Reverse a linked list.

   ::: hint Think about pointers
   Three references.
   :::

   ::: {.solution #reverse title="Solution & analysis" open}
   Walk once: $O(n)$.

   - in place
   :::
`);
	assert.match(code, /<details class="reveal reveal-hint"><summary class="reveal-summary">[^]*?<svg[^]*?<span>Hint<\/span><\/summary><div class="reveal-content"><p>Save <code>next<\/code> first.<\/p><\/div><\/details>/);
	assert.match(code, /<li>\s*<p>Reverse a linked list.<\/p>\s*<details class="reveal reveal-hint">[^]*?<span>Think about pointers<\/span>/);
	assert.match(code, /<details class="reveal reveal-solution" id="reverse" open><summary[^]*?<span>Solution &#x26; analysis<\/span>[^]*?<li>in place<\/li>\s*<\/ul><\/div><\/details>/);
	assert.doesNotMatch(code, /:::/);
});

test('callouts accept the attribute form and keep an id', async () => {
	const { code } = await processor.render('::: {.note #setup title="Before you start"}\nBody\n:::');
	assert.match(code, /<div class="callout callout-note" data-callout="note" id="setup">[^]*?<span>Before you start<\/span>[^]*?<p>Body<\/p>/);
});

const abcProcessor = await createMarkdownProcessor({ remarkPlugins: [[remarkAbc, { swing: 66 }]], syntaxHighlight: false });

test('ABC fences take LibroMorph attributes: ids, listening items and swing', async () => {
	const { code } = await abcProcessor.render(`\`\`\`{#q1 .abc .listen}
X:1
T:Interval 1
K:C
CG|
\`\`\`

\`\`\`{#straight .abc}
X:1
%%MIDI swing 50
K:C
C|
\`\`\`

\`\`\`abc
X:1
%%MIDI swing 60
K:C
C|
\`\`\`
`);
	assert.match(code, /<figure class="abc-block abc-listen" id="q1">[^]*?<span class="abc-header-title">Interval 1<\/span><span class="abc-header-type">Listen<\/span><\/figcaption><div class="abc-listen-notation" aria-hidden="true"><div class="abc-body" data-abc="X:1\nT:Interval 1[^"]*" data-swing="66"><\/div><\/div><\/figure>/);
	assert.match(code, /<figure class="abc-block" id="straight">[^]*?<div class="abc-body" data-abc="[^"]*"><\/div>/);
	assert.match(code, /data-swing="60"/);
	assert.doesNotMatch(code, /language-|code-block/);
});
