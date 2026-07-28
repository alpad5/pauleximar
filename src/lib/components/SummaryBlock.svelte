<script lang="ts">
	import type { Todo } from '$lib/types';
	import { priColor, priTitle, dueLabel } from '$lib/priority';
	import { hits } from '$lib/search';
	import Mark from './Mark.svelte';

	type Item = Todo & { blockTitle: string; blockColor: string };

	type Props = {
		items: Item[];
		/** Folded search query; when set, chips narrow to matching tasks. */
		query?: string;
	};

	let { items, query = '' }: Props = $props();

	const shown = $derived(items.filter((i) => !query || hits(i.text, query)));
</script>

<div class="chips">
	{#each shown as item (item.id)}
		<span class="chip" style="--pri: {priColor(item.priority)};" title={`en ${item.blockTitle}`}>
			<span class="dot" aria-label={priTitle(item.priority)}></span>
			<span class="text"><Mark text={item.text} {query} /></span>
			{#if item.due_date}
				<span class="due {dueLabel(item.due_date).state}">{dueLabel(item.due_date).text}</span>
			{/if}
			<span class="src" style="--c: {item.blockColor};">{item.blockTitle}</span>
		</span>
	{:else}
		<span class="empty">{query ? 'sin coincidencias aquí' : 'sin prioridades todavía'}</span>
	{/each}
</div>

<style>
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-content: flex-start;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.6rem 0.3rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--pri) 14%, var(--paper));
		border: 1px solid color-mix(in srgb, var(--pri) 35%, transparent);
		font-size: 0.85rem;
		max-width: 100%;
	}
	.dot {
		flex-shrink: 0;
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 50%;
		background: var(--pri);
		border: 1.5px solid rgba(0, 0, 0, 0.18);
	}
	.text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 16rem;
	}
	.due {
		flex-shrink: 0;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.05rem 0.4rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.06);
		color: var(--muted);
	}
	.due.today,
	.due.soon {
		background: color-mix(in srgb, #e0a34e 30%, var(--paper));
		color: #a66a12;
	}
	.due.overdue {
		background: color-mix(in srgb, #e05a4d 30%, var(--paper));
		color: #b02a1d;
	}
	.src {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.7rem;
		color: var(--muted);
	}
	.src::before {
		content: '';
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: var(--c);
	}
	.empty {
		color: var(--muted);
		font-style: italic;
		font-size: 0.85rem;
	}
</style>
