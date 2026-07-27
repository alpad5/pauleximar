<script lang="ts">
	import type { Block } from '$lib/types';
	import type { Snippet } from 'svelte';

	type Props = {
		block: Block;
		boardId: string;
		banner?: boolean;
		wide?: boolean;
		children: Snippet;
	};

	let { block, boardId, banner = false, wide = false, children }: Props = $props();

	let editing = $state(false);
	let draft = $state('');

	function startEdit() {
		draft = block.title;
		editing = true;
	}

	async function commit() {
		const next = draft.trim();
		editing = false;
		if (!next || next === block.title) return;
		await fetch(`/b/${boardId}/api/blocks/${block.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: next })
		});
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.currentTarget as HTMLInputElement).blur();
		} else if (e.key === 'Escape') {
			draft = block.title;
			editing = false;
		}
	}

	async function remove() {
		const ok = confirm(`¿Eliminar el bloque "${block.title}"? Se borrará todo su contenido.`);
		if (!ok) return;
		await fetch(`/b/${boardId}/api/blocks/${block.id}`, { method: 'DELETE' });
	}
</script>

<section class="block" class:banner class:wide style="--accent: {block.color};">
	<header>
		{#if editing}
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="title-input"
				bind:value={draft}
				onblur={commit}
				onkeydown={onKeydown}
				autofocus
				maxlength="80"
			/>
		{:else}
			<button class="title" onclick={startEdit} title="Renombrar">
				{block.title}
			</button>
		{/if}
		<button class="delete" onclick={remove} title="Eliminar bloque" aria-label="Eliminar bloque">
			×
		</button>
	</header>
	<div class="body">
		{@render children()}
	</div>
</section>

<style>
	.block {
		background: color-mix(in srgb, var(--accent) 12%, var(--paper));
		border-radius: 1.1rem;
		padding: 1.25rem 1.25rem 1rem;
		box-shadow:
			0 1px 0 rgba(0, 0, 0, 0.02),
			0 8px 24px -16px rgba(0, 0, 0, 0.18);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 8rem;
	}
	/* Mosaic: some blocks span two columns on wider screens. */
	.block.wide {
		grid-column: span 2;
	}
	@media (max-width: 40rem) {
		.block.wide {
			grid-column: span 1;
		}
	}
	/* Full-width priorities banner sits above the grid; hug its content. */
	.block.banner {
		min-height: auto;
	}
	.block::before {
		content: '';
		position: absolute;
		inset: 0 0 auto 0;
		height: 4px;
		background: var(--accent);
	}
	header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0.25rem 0 0.9rem;
	}
	.delete {
		margin-left: auto;
		flex-shrink: 0;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 1.2rem;
		line-height: 1;
		padding: 0.1rem 0.4rem;
		border-radius: 0.4rem;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.12s;
	}
	.block:hover .delete,
	.delete:focus-visible {
		opacity: 1;
	}
	.delete:hover {
		background: rgba(0, 0, 0, 0.06);
		color: var(--ink);
	}
	.title,
	.title-input {
		font: inherit;
		font-weight: 600;
		font-size: 1rem;
		letter-spacing: -0.01em;
		color: var(--ink);
		background: transparent;
		border: none;
		padding: 0.15rem 0.3rem;
		margin: -0.15rem -0.3rem;
		border-radius: 0.4rem;
		cursor: text;
		text-align: left;
	}
	.title:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	.title-input {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.body {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
</style>
