<script lang="ts">
	// The logotype: a lowercase Yeseva One 'b' in an accent-filled rounded square.
	// `size` is the box edge in px; the glyph scales with it.
	type Props = { size?: number };
	let { size = 30 }: Props = $props();
</script>

<span class="logo" style="--box: {size}px" aria-hidden="true">b</span>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--box);
		height: var(--box);
		flex: 0 0 auto;
		border-radius: calc(var(--box) * 0.28);
		background: var(--accent);
		color: #1d1c1a;
		font-family: var(--font-display);
		/* Yeseva's lowercase b runs small in the box; 0.72 fills it without crowding. */
		font-size: calc(var(--box) * 0.72);
		line-height: 1;
		/* Nudge up so the bowl, not the ascender, sits optically centred. */
		text-indent: 0.02em;
		padding-bottom: calc(var(--box) * 0.06);
		user-select: none;
	}
</style>
