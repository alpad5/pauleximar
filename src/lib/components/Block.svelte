<script lang="ts">
	import type { Block } from '$lib/types';
	import type { Snippet } from 'svelte';

	type Props = {
		block: Block;
		boardId: string;
		children: Snippet;
	};

	let { block, boardId, children }: Props = $props();

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
</script>

<section class="block" style="--accent: {block.color};">
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
		min-height: 14rem;
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
		margin: 0.25rem 0 0.9rem;
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
