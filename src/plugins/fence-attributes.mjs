/**
 * Pandoc-style attributes, as LibroMorph reads them on fences and `:::` blocks:
 * `{#id .class .other key=value key="a b"}`. Braces are optional, and a bare
 * word without `.` or `#` (the fence language, say) counts as a class.
 *
 * Curly quotes are accepted too: on a `:::` opener the text has already been
 * through smartypants by the time rehype sees it.
 *
 * @param {string} source
 * @returns {{ classes: string[], id: string, attrs: Record<string, string> }}
 */
export function parseAttributes(source = '') {
	const inner = String(source ?? '').trim().replace(/^\{/, '').replace(/\}$/, '');
	const classes = [];
	const attrs = {};
	let id = '';
	for (const match of inner.matchAll(/([^\s=]+)=(?:"([^"]*)"|“([^”]*)”|'([^']*)'|‘([^’]*)’|(\S+))|(\S+)/g)) {
		if (match[7] !== undefined) {
			const word = match[7];
			if (word.startsWith('#')) id = word.slice(1);
			else classes.push(word.replace(/^\./, ''));
		} else {
			attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6];
		}
	}
	return { classes, id, attrs };
}

/** `{.rhythm-grid .circle #id key=value}` or `rhythm-grid .circle key=value`, split by remark into lang and meta. */
export function parseFenceAttributes(lang = '', meta = '') {
	return parseAttributes(`${lang ?? ''} ${meta ?? ''}`);
}
