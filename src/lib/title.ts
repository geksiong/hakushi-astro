/**
 * Title resolution shared by every place an article title is shown.
 *
 * When frontmatter has no usable `title`, the first level-1 heading of the
 * Markdown body becomes the title (mirroring the remark plugin in
 * `src/plugins/remark-first-h1-title.mjs`, which removes that heading from
 * the rendered output). Both implementations agree on what "first h1" means:
 * a top-level ATX (`# Title`) or setext (`Title` + `===`) heading outside
 * fenced code blocks. Anything else falls back to the entry id.
 *
 * This module is dependency-free so content routes, search/graph builders,
 * and components can all use it without pulling in extra bundles.
 */

const FENCED_DELIMITER = /^ {0,3}(`{3,}|~{3,})/;
/** Exactly one `#` followed by a space/tab or end of line (up to 3 leading spaces). */
const ATX_H1 = /^ {0,3}#(?!#)(?:[ \t]+(.*?))?[ \t]*$/;
const SETEXT_H1 = /^ {0,3}=+[ \t]*$/;
/** Lines that can never start a setext heading's paragraph text. */
const NON_PARAGRAPH_START =
	/^ {0,3}(#{1,6}[ \t]|>|(-|\+|\*)[ \t]|\d+[.)][ \t]|\||```|~~~|<|={1,}[ \t]*$)/;

/** Reduce inline Markdown to plain text for title purposes. */
function plainText(text: string): string {
	return text
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
		.replace(/(`+)([^`]*)\1/g, '$2')
		.replace(/(\*\*|__)(.*?)\1/g, '$2')
		.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1$2')
		.replace(/(^|[^_\w])_([^_\n]+)_/g, '$1$2')
		.replace(/~~(.*?)~~/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/[ \t]+#+[ \t]*$/, '')
		.trim();
}

/**
 * Plain-text content of the first level-1 heading in a Markdown body,
 * or `undefined` when there is none. Blank headings are skipped.
 */
export function extractFirstH1(body: string): string | undefined {
	const lines = (body ?? '').split('\n');
	let fence: { marker: string; length: number } | null = null;
	let prevText: string | null = null;

	for (const line of lines) {
		const delimiter = line.match(FENCED_DELIMITER);
		if (delimiter) {
			const run = delimiter[1];
			const close = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
			if (fence === null) {
				fence = { marker: run[0], length: run.length };
			} else if (close && close[1][0] === fence.marker && close[1].length >= fence.length) {
				fence = null;
			}
			prevText = null;
			continue;
		}
		if (fence !== null) continue;

		const atx = line.match(ATX_H1);
		if (atx) {
			const title = plainText(atx[1] ?? '');
			if (title) return title;
			prevText = null;
			continue;
		}

		if (SETEXT_H1.test(line)) {
			if (prevText !== null) {
				const title = plainText(prevText);
				if (title) return title;
			}
			prevText = null;
			continue;
		}

		prevText = line.trim() !== '' && !NON_PARAGRAPH_START.test(line) ? line.trim() : null;
	}
	return undefined;
}

export interface TitledEntry {
	id: string;
	body?: string;
	data?: { title?: string | null };
}

/** Frontmatter title, else first h1, else the entry id. Blank values are skipped. */
export function resolveEntryTitle(entry: TitledEntry): string {
	const frontmatter = entry.data?.title;
	if (typeof frontmatter === 'string' && frontmatter.trim() !== '') return frontmatter;
	return extractFirstH1(entry.body ?? '') ?? entry.id;
}
