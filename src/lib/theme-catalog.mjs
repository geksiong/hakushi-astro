import { COLOR_SCHEMES, THEME_STYLES, LAYOUT_SCHEMES, FONT_SIZES, PRESET_THEMES } from './theme-data.mjs';

/**
 * Merges user-configured color schemes, typography styles, layouts, font sizes
 * and presets with the built-in catalogs, and resolves the default selection.
 * Runs once at config time; the result is serialized into
 * `virtual:hakushi/config` so the no-FOUC script, applyTheme() and the theme
 * picker all read the same lists.
 *
 * Per catalog: a built-in id merges the given fields over the built-in entry,
 * `false` removes a built-in, and a new id adds an entry (missing fields are
 * filled from the fallback built-in). New entries are listed before built-ins.
 *
 * Built-in entries are only offered where `theme.builtIns` turns them on (by
 * default just the font sizes), so an unconfigured site is locked to its
 * defaults. The default selection is always available. Entries a preset needs
 * but that aren't offered on their own are included with `hidden: true`: they
 * can be applied, but the picker doesn't list them.
 */

/** Which catalogs include their built-in entries when `theme.builtIns` doesn't say. */
export const DEFAULT_BUILT_INS = { presets: false, colorSchemes: false, styles: false, layouts: false, fontSizes: true };

export const COLOR_KEYS = ['primary', 'primaryHover', 'accent', 'secondary', 'bgMain', 'bgSurface', 'bgSidebar', 'border', 'textMain', 'textMuted'];

/** Fields only describing an entry in the picker; never inherited by a new entry. */
const DISPLAY_FIELDS = ['name', 'description', 'badge', 'label', 'tagline'];

const FONT_FIELDS = ['fontHeading', 'fontBody', 'fontCode'];

const CATALOGS = [
	{ key: 'colorSchemes', selection: 'colorScheme', label: 'color scheme', builtIns: COLOR_SCHEMES, fallback: 'hakushi' },
	{ key: 'styles', selection: 'style', label: 'typography style', builtIns: THEME_STYLES, fallback: 'sans' },
	{ key: 'layouts', selection: 'layout', label: 'layout', builtIns: LAYOUT_SCHEMES, fallback: 'comfortable' },
	{ key: 'fontSizes', selection: 'fontSize', label: 'font size', builtIns: FONT_SIZES, fallback: 'md' },
	{ key: 'presets', selection: 'preset', label: 'preset theme', builtIns: PRESET_THEMES, fallback: 'hakushi' },
];

const PRESET_REFS = [
	['colorScheme', 'colorSchemes'],
	['style', 'styles'],
	['layout', 'layouts'],
	['fontSize', 'fontSizes'],
];

const fail = (message) => {
	throw new Error(`[hakushi] ${message}`);
};

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function checkColors(id, field, colors) {
	if (colors === undefined) return;
	if (!isPlainObject(colors)) fail(`Color scheme "${id}": \`${field}\` must be an object.`);
	for (const [key, value] of Object.entries(colors)) {
		if (!COLOR_KEYS.includes(key)) {
			fail(`Color scheme "${id}": unknown color \`${field}.${key}\`. Expected one of: ${COLOR_KEYS.join(', ')}.`);
		}
		if (typeof value !== 'string' || !value.trim()) fail(`Color scheme "${id}": \`${field}.${key}\` must be a CSS color string.`);
	}
}

function withoutDisplayFields(entry) {
	const copy = { ...entry };
	for (const field of DISPLAY_FIELDS) delete copy[field];
	return copy;
}

function mergeEntry(catalog, id, base, override, isNew) {
	if (catalog.key === 'colorSchemes') {
		checkColors(id, 'colors', override.colors);
		checkColors(id, 'darkColors', override.darkColors);
		// A new scheme without darkColors reuses its light colors in dark mode.
		const dark = override.darkColors ?? (isNew ? override.colors : undefined);
		return {
			...base,
			...override,
			id,
			colors: { ...base.colors, ...override.colors },
			darkColors: { ...base.darkColors, ...dark },
		};
	}
	if (catalog.key === 'styles' && override.stylesheet !== undefined) {
		const sheets = [].concat(override.stylesheet);
		if (!sheets.every((href) => typeof href === 'string' && href)) {
			fail(`Typography style "${id}": \`stylesheet\` must be a URL string or an array of them.`);
		}
		// Fonts inherited from the base entry still need the base's stylesheet.
		if (FONT_FIELDS.some((field) => override[field] === undefined)) {
			return { ...base, ...override, id, stylesheet: [...new Set([...[].concat(base.stylesheet ?? []), ...sheets])] };
		}
	}
	return { ...base, ...override, id };
}

function resolveCatalog(catalog, entries, includeBuiltIns) {
	if (entries !== undefined && !isPlainObject(entries)) fail(`\`theme.${catalog.key}\` must be an object keyed by id.`);
	const custom = entries ?? {};
	const added = {};
	const builtIn = {};

	if (includeBuiltIns) {
		for (const [id, entry] of Object.entries(catalog.builtIns)) {
			const override = custom[id];
			if (override === false) continue;
			if (override === undefined) builtIn[id] = entry;
			else if (isPlainObject(override)) builtIn[id] = mergeEntry(catalog, id, entry, override, false);
			else fail(`\`theme.${catalog.key}.${id}\` must be an object or \`false\`.`);
		}
	}

	const fallback = withoutDisplayFields(catalog.key === 'presets' ? {} : catalog.builtIns[catalog.fallback]);
	for (const [id, entry] of Object.entries(custom)) {
		if (includeBuiltIns && id in catalog.builtIns) continue;
		if (entry === false) continue; // removing an entry that isn't there is harmless
		if (!isPlainObject(entry)) fail(`\`theme.${catalog.key}.${id}\` must be an object.`);
		if (id in catalog.builtIns) {
			// Built-ins are switched off, but this one is opted back in (optionally with overrides).
			builtIn[id] = mergeEntry(catalog, id, catalog.builtIns[id], entry, false);
			continue;
		}
		added[id] = { name: id, ...mergeEntry(catalog, id, fallback, entry, true) };
		if (catalog.key === 'fontSizes' && !entry.label) added[id].label = added[id].name;
	}

	return { ...added, ...builtIn };
}

/**
 * Resolves `options.theme` into the normalized `config.theme` shape:
 * the default selection plus the full merged catalogs.
 */
export function resolveTheme(themeOptions = {}, defaults = {}) {
	if (!isPlainObject(themeOptions)) fail('`theme` must be an object.');
	const builtInsOption = themeOptions.builtIns ?? {};
	if (typeof builtInsOption !== 'boolean' && !isPlainObject(builtInsOption)) {
		fail('`theme.builtIns` must be `true`, `false`, or an object such as `{ presets: true, colorSchemes: true }`.');
	}
	// Font sizes keep their built-ins unless switched off by name.
	const includeBuiltIns = (key) =>
		typeof builtInsOption === 'boolean'
			? key === 'fontSizes' || builtInsOption
			: (builtInsOption[key] ?? DEFAULT_BUILT_INS[key]) !== false;

	const catalogs = {};
	const removed = {};
	for (const catalog of CATALOGS) {
		const entries = themeOptions[catalog.key];
		catalogs[catalog.key] = resolveCatalog(catalog, entries, includeBuiltIns(catalog.key));
		removed[catalog.key] = new Set(
			Object.entries(isPlainObject(entries) ? entries : {})
				.filter(([, entry]) => entry === false)
				.map(([id]) => id)
		);
	}

	/**
	 * Makes `id` available in a catalog, adding the built-in entry if it isn't
	 * there yet (unless configured away with `false`). `listed` entries appear
	 * in the picker; others are added as hidden. Returns false if unknown.
	 */
	const ensure = (catalog, id, listed) => {
		const entries = catalogs[catalog.key];
		if (id in entries) {
			if (listed && entries[id].hidden) {
				const { hidden, ...entry } = entries[id];
				entries[id] = entry;
			}
			return true;
		}
		if (!(id in catalog.builtIns) || removed[catalog.key].has(id)) return false;
		entries[id] = listed ? catalog.builtIns[id] : { ...catalog.builtIns[id], hidden: true };
		return true;
	};
	const known = (catalog) => Object.keys(catalogs[catalog.key]).join(', ') || '(none)';

	const pick = (catalog, explicit, source = `\`theme.${catalog.selection}\``) => {
		if (explicit !== undefined && explicit !== null && explicit !== '') {
			if (!ensure(catalog, explicit, true)) {
				fail(`Unknown ${catalog.label} "${explicit}" in ${source}. Available: ${known(catalog)}.`);
			}
			return explicit;
		}
		// No choice made: the built-in default if offered, else the first configured entry,
		// else the built-in default on its own.
		const fallback = defaults[catalog.selection] ?? catalog.fallback;
		if (fallback in catalogs[catalog.key]) return fallback;
		const first = Object.keys(catalogs[catalog.key])[0];
		if (first) return first;
		if (ensure(catalog, fallback, true)) return fallback;
		fail(`\`theme.${catalog.key}\` removes every ${catalog.label}; at least one is required.`);
	};

	const presetCatalog = CATALOGS.find((catalog) => catalog.key === 'presets');
	const preset = themeOptions.preset ? pick(presetCatalog, themeOptions.preset) : undefined;
	const presetEntry = preset ? catalogs.presets[preset] : {};

	const selection = { mode: themeOptions.mode ?? defaults.mode ?? 'dark' };
	if (!['light', 'dark', 'auto'].includes(selection.mode)) fail('`theme.mode` must be "light", "dark", or "auto".');
	for (const catalog of CATALOGS) {
		if (catalog.key === 'presets') continue;
		// An explicit option wins over the configured preset's value.
		const explicit = themeOptions[catalog.selection];
		selection[catalog.selection] =
			explicit !== undefined
				? pick(catalog, explicit)
				: pick(catalog, presetEntry[catalog.selection], `preset theme "${preset}" (\`theme.preset\`)`);
	}
	if (preset) selection.preset = preset;

	for (const [id, entry] of Object.entries(catalogs.presets)) {
		const filled = { ...entry };
		const untouchedBuiltIn = entry === PRESET_THEMES[id];
		for (const [field, key] of PRESET_REFS) {
			if (filled[field] === undefined) filled[field] = selection[field];
			const catalog = CATALOGS.find((c) => c.key === key);
			// A preset can use entries the picker doesn't offer on their own.
			if (!ensure(catalog, filled[field], false)) {
				// A built-in preset whose scheme/style/layout was removed simply drops out.
				if (untouchedBuiltIn && preset !== id) {
					delete catalogs.presets[id];
					break;
				}
				fail(`Preset theme "${id}" uses unknown ${field} "${filled[field]}". Available: ${known(catalog)}.`);
			}
		}
		if (id in catalogs.presets) catalogs.presets[id] = filled;
	}

	return { ...selection, ...catalogs };
}
