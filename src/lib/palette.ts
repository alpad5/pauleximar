// Curated block accent colors — muted tones that read well on the "paper"
// background in both light and dark mode. Shared by the add-block UI (swatches)
// and the server (validation), so the two never drift.
export const PALETTE = [
	'#f4c95d', // amber
	'#e29578', // coral
	'#e0a3a3', // rose
	'#b58db6', // mauve
	'#9a8fb8', // lavender
	'#83a6c9', // blue
	'#7fb7be', // teal
	'#8fb996', // green
	'#a3b18a', // sage
	'#d4a373', // camel
	'#c78d5a', // clay
	'#9c9a94' // stone
] as const;

export type PaletteColor = (typeof PALETTE)[number];

export function isPaletteColor(value: unknown): value is PaletteColor {
	return typeof value === 'string' && (PALETTE as readonly string[]).includes(value);
}
