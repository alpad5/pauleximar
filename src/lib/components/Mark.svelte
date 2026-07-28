<script lang="ts">
	import { segments } from '$lib/search';

	type Props = { text: string; query: string };
	let { text, query }: Props = $props();
</script>

<!-- prettier-ignore -->
{#each segments(text, query) as seg}{#if seg.hit}<mark>{seg.text}</mark>{:else}{seg.text}{/if}{/each}

<style>
	/* Tinted with the block's own accent, so each block highlights in its hue. */
	mark {
		background: color-mix(in srgb, var(--accent) 60%, transparent);
		color: inherit;
		border-radius: 0.2rem;
		padding: 0 0.08em;
	}
	/* On dark paper the accent is the bright element; back it off to keep the
	   light ink readable on top. */
	@media (prefers-color-scheme: dark) {
		mark {
			background: color-mix(in srgb, var(--accent) 30%, transparent);
		}
	}
</style>
