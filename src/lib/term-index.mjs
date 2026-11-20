// Shared syntax and anchor naming for article markup and the site-wide index.
export const INDEX_RE = /\[([^\]\n]+)\]\{\.index(?:\s+entry=["“]([^"”]+)["”])?\}|\{index:\s*["“]?([^{}"”]+)["”]?\}/g;

export function indexMarker(match) {
	const visible = match[1] !== undefined;
	const term = (match[2] ?? match[1] ?? match[3] ?? '').trim();
	return term ? { visible, term, label: visible ? match[1] : '' } : null;
}

export function indexAnchor(term, counts) {
	const slug = term.normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'term';
	const count = (counts.get(slug) ?? 0) + 1;
	counts.set(slug, count);
	return `idx-${slug}-${count}`;
}

// Read raw Markdown for the index page. Fenced and inline code cannot contain
// active index markers, matching the remark transform's text-node behavior.
export function scanIndexMarkers(body) {
	const counts = new Map();
	const found = [];
	let fence = null;
	for (const line of body.split('\n')) {
		const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
		if (delimiter) {
			const run = delimiter[1];
			if (!fence) fence = { mark: run[0], length: run.length };
			else if (run[0] === fence.mark && run.length >= fence.length && /^ {0,3}(`{3,}|~{3,})[ \t]*$/.test(line)) fence = null;
			continue;
		}
		if (fence) continue;
		const prose = line.replace(/(`+)([^`]*?)\1/g, '');
		for (const match of prose.matchAll(INDEX_RE)) {
			const marker = indexMarker(match);
			if (marker) found.push({ ...marker, anchor: indexAnchor(marker.term, counts) });
		}
	}
	return found;
}
