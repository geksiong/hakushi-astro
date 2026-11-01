export type FooterSegment = { text: string } | { text: string; href: string; external: boolean };

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Split a footer string into text and link segments. `[label](href)` becomes
 * a link (absolute URLs open in a new tab); `{year}` and `{title}` are
 * replaced with the build year and the site title. Everything else is plain
 * text, so HTML in the configuration is shown as written.
 */
export function parseFooterText(source: string, vars: { title: string; year?: number }): FooterSegment[] {
	const fill = (text: string) =>
		text.replace(/\{year\}/g, String(vars.year ?? new Date().getFullYear())).replace(/\{title\}/g, vars.title);
	const segments: FooterSegment[] = [];
	let last = 0;
	for (const match of source.matchAll(LINK)) {
		if (match.index > last) segments.push({ text: fill(source.slice(last, match.index)) });
		const href = match[2];
		segments.push({ text: fill(match[1]), href, external: /^(https?:)?\/\//i.test(href) });
		last = match.index + match[0].length;
	}
	if (last < source.length) segments.push({ text: fill(source.slice(last)) });
	return segments;
}
