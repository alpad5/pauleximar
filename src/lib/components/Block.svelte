<script lang="ts">
	import type { Block } from '$lib/types';
	import type { Snippet } from 'svelte';
	import Mark from './Mark.svelte';

	type Props = {
		block: Block;
		boardId: string;
		banner?: boolean;
		wide?: boolean;
		/** Folded search query, for highlighting the title. */
		query?: string;
		/** True while a search is running and this block has no match. */
		dimmed?: boolean;
		/** Show the drag grip and width toggle (grid blocks only). */
		movable?: boolean;
		/** True for the block currently being dragged. */
		dragging?: boolean;
		/** Pointer offset applied while dragging, in px. */
		dx?: number;
		dy?: number;
		/** Pointer went down on the grip. */
		onGrab?: (e: PointerEvent) => void;
		/** Keyboard reorder from the grip: -1 = earlier, +1 = later. */
		onNudge?: (delta: number) => void;
		children: Snippet;
	};

	let {
		block,
		boardId,
		banner = false,
		wide = false,
		query = '',
		dimmed = false,
		movable = false,
		dragging = false,
		dx = 0,
		dy = 0,
		onGrab,
		onNudge,
		children
	}: Props = $props();

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

	// Writing `span` pins the width; the mosaic default only applies while it's null.
	async function toggleWidth() {
		const next = wide ? 1 : 2;
		block.span = next; // optimistic; the SSE echo is idempotent
		await fetch(`/b/${boardId}/api/blocks/${block.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ span: next })
		});
	}

	function onGripKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			onNudge?.(-1);
		} else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			onNudge?.(1);
		}
	}

	async function remove() {
		const ok = confirm(`¿Eliminar el bloque "${block.title}"? Se borrará todo su contenido.`);
		if (!ok) return;
		await fetch(`/b/${boardId}/api/blocks/${block.id}`, { method: 'DELETE' });
	}
</script>

<section
	class="block"
	class:banner
	class:wide
	class:dimmed
	class:dragging
	data-block-id={block.id}
	style="--accent: {block.color}; {dragging ? `translate: ${dx}px ${dy}px;` : ''}"
>
	<header>
		{#if movable}
			<button
				class="grip"
				onpointerdown={onGrab}
				onkeydown={onGripKeydown}
				title="Arrastrar para mover (o flechas)"
				aria-label="Mover bloque"
			>
				⠿
			</button>
		{/if}
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
				<Mark text={block.title} {query} />
			</button>
		{/if}
		<div class="tools">
			{#if movable}
				<button
					class="size"
					onclick={toggleWidth}
					title={wide ? 'Estrechar a una columna' : 'Ensanchar a dos columnas'}
					aria-label={wide ? 'Estrechar bloque' : 'Ensanchar bloque'}
					aria-pressed={wide}
				>
					{wide ? '2×' : '1×'}
				</button>
			{/if}
			<button class="delete" onclick={remove} title="Eliminar bloque" aria-label="Eliminar bloque">
				×
			</button>
		</div>
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
	/* Searching: matches keep their colour, everything else recedes. */
	.block.dimmed {
		opacity: 0.3;
		filter: saturate(0.4);
	}
	.block.dimmed:hover,
	.block.dimmed:focus-within {
		opacity: 0.75;
	}
	.block {
		transition:
			opacity 0.15s,
			filter 0.15s;
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
	.tools {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.15rem;
		flex-shrink: 0;
	}
	.delete {
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
	/* Grip and width toggle: same "quiet until you look at the block" treatment. */
	.grip,
	.size {
		flex-shrink: 0;
		border: none;
		background: transparent;
		color: var(--muted);
		line-height: 1;
		border-radius: 0.4rem;
		opacity: 0;
		transition: opacity 0.12s;
	}
	.grip {
		font-size: 0.95rem;
		padding: 0.2rem 0.15rem;
		margin-left: -0.2rem;
		cursor: grab;
		/* Keep the browser from claiming the gesture as a scroll on touch. */
		touch-action: none;
	}
	.size {
		font: inherit;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		padding: 0.2rem 0.35rem;
		cursor: pointer;
	}
	.block:hover .grip,
	.block:hover .size,
	.grip:focus-visible,
	.size:focus-visible {
		opacity: 1;
	}
	.grip:hover,
	.size:hover {
		background: rgba(0, 0, 0, 0.06);
		color: var(--ink);
	}
	/* The block being dragged rides the pointer; its grid slot stays open as the
	   drop preview, and it must not intercept the hit-test for the block below. */
	.block.dragging {
		pointer-events: none;
		z-index: 5;
		cursor: grabbing;
		opacity: 0.95;
		scale: 1.02;
		box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.45);
	}
	.block.dragging .grip {
		opacity: 1;
		cursor: grabbing;
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
