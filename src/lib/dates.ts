import config from 'virtual:hakushi/config';

/**
 * Human-readable calendar day ("Aug 1, 2026") in the site language.
 * Frontmatter dates are calendar days parsed as UTC midnight, so format in
 * UTC - the day never shifts with the build machine's or reader's timezone.
 */
export function formatDate(date: Date | string | undefined): string {
	if (!date) return '';
	const value = typeof date === 'string' ? new Date(date) : date;
	if (Number.isNaN(value.getTime())) return typeof date === 'string' ? date : '';
	return value.toLocaleDateString(config.lang, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}
