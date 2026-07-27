<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Block from '$lib/components/Block.svelte';
	import TodoBlock from '$lib/components/TodoBlock.svelte';
	import NotesBlock from '$lib/components/NotesBlock.svelte';
	import type { PageData } from './$types';
	import type { BoardEvent } from '$lib/server/realtime';
	import type { BlockKind } from '$lib/types';
	import { PALETTE } from '$lib/palette';

	type Props = { data: PageData };
	let { data }: Props = $props();

	// We intentionally snapshot the server-loaded data once and then mutate locally
	// via SSE events; the load function is not invalidated mid-session.
	// svelte-ignore state_referenced_locally
	let blocks = $state(data.snapshot.blocks.map((b) => ({ ...b, todos: [...b.todos] })));
	let copied = $state(false);

	// svelte-ignore state_referenced_locally
	const boardId = data.snapshot.board.id;

	function applyEvent(event: BoardEvent) {
		if (event.type === 'todo_added') {
			const block = blocks.find((b) => b.id === event.todo.block_id);
			if (block && !block.todos.some((t) => t.id === event.todo.id)) {
				block.todos.push(event.todo);
			}
		} else if (event.type === 'todo_updated') {
			const block = blocks.find((b) => b.id === event.todo.block_id);
			if (!block) return;
			const idx = block.todos.findIndex((t) => t.id === event.todo.id);
			if (idx >= 0) block.todos[idx] = event.todo;
		} else if (event.type === 'todo_deleted') {
			const block = blocks.find((b) => b.id === event.block_id);
			if (!block) return;
			block.todos = block.todos.filter((t) => t.id !== event.id);
		} else if (event.type === 'block_renamed') {
			const block = blocks.find((b) => b.id === event.block.id);
			if (block) block.title = event.block.title;
		} else if (event.type === 'block_added') {
			if (!blocks.some((b) => b.id === event.block.id)) {
				blocks.push({ ...event.block, todos: [] });
			}
		} else if (event.type === 'note_updated') {
			const block = blocks.find((b) => b.id === event.block_id);
			if (block) block.note = event.body;
		}
	}

	onMount(() => {
		try {
			localStorage.setItem('pauleximar:lastBoard', boardId);
		} catch {
			// localStorage may be unavailable; not fatal.
		}

		const source = new EventSource(`/b/${boardId}/stream`);
		const types: BoardEvent['type'][] = [
			'todo_added',
			'todo_updated',
			'todo_deleted',
			'block_renamed',
			'block_added',
			'note_updated'
		];
		for (const type of types) {
			source.addEventListener(type, (e) => {
				try {
					applyEvent(JSON.parse((e as MessageEvent).data));
				} catch {
					// ignore malformed events
				}
			});
		}
		return () => source.close();
	});

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(page.url.href);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			// clipboard blocked; user can still copy from the address bar
		}
	}

	// --- Add block ---
	let adding = $state(false);
	let newTitle = $state('');
	let newKind = $state<BlockKind>('todos');
	let newColor = $state<string>(PALETTE[0]);
	let creating = $state(false);

	function startAdding() {
		adding = true;
		newTitle = '';
		newKind = 'todos';
		newColor = PALETTE[0];
	}

	async function createBlock() {
		const title = newTitle.trim();
		if (!title || creating) return;
		creating = true;
		try {
			const res = await fetch(`/b/${boardId}/api/blocks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ kind: newKind, title, color: newColor })
			});
			if (res.ok) {
				const block = await res.json();
				// Optimistic insert; the SSE echo is de-duped by id in applyEvent.
				if (!blocks.some((b) => b.id === block.id)) {
					blocks.push({ ...block, todos: [] });
				}
				adding = false;
			}
		} catch {
			// leave the form open so the user can retry
		} finally {
			creating = false;
		}
	}
</script>

<svelte:head>
	<title>pauleximar — board</title>
</svelte:head>

<header class="topbar">
	<a href="/" class="brand">pauleximar</a>
	<button class="share" onclick={copyLink}>
		{copied ? 'copiado ✓' : 'copiar enlace'}
	</button>
</header>

<main class="grid">
	{#each blocks as block (block.id)}
		<Block {block} {boardId}>
			{#if block.kind === 'todos'}
				<TodoBlock blockId={block.id} {boardId} todos={block.todos} />
			{:else if block.kind === 'notes'}
				<NotesBlock blockId={block.id} {boardId} body={block.note ?? ''} />
			{:else}
				<p class="todo-fallback">block kind "{block.kind}" not implemented yet</p>
			{/if}
		</Block>
	{/each}

	{#if adding}
		<section class="add-block">
			<div class="kinds">
				<button class:active={newKind === 'todos'} onclick={() => (newKind = 'todos')}>
					lista
				</button>
				<button class:active={newKind === 'notes'} onclick={() => (newKind = 'notes')}>
					notas
				</button>
			</div>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="add-title"
				placeholder="nombre (ej. Viaje)"
				bind:value={newTitle}
				onkeydown={(e) => {
					if (e.key === 'Enter') createBlock();
					else if (e.key === 'Escape') adding = false;
				}}
				autofocus
				maxlength="80"
			/>
			<div class="swatches">
				{#each PALETTE as color (color)}
					<button
						type="button"
						class="swatch"
						class:selected={newColor === color}
						style="--swatch: {color};"
						aria-label="color {color}"
						aria-pressed={newColor === color}
						onclick={() => (newColor = color)}
					></button>
				{/each}
			</div>
			<div class="add-actions">
				<button class="ghost" onclick={() => (adding = false)}>cancelar</button>
				<button class="primary" onclick={createBlock} disabled={!newTitle.trim() || creating}>
					añadir bloque
				</button>
			</div>
		</section>
	{:else}
		<button class="add-block placeholder" onclick={startAdding}>
			<span>＋ añadir bloque</span>
		</button>
	{/if}
</main>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.2rem 1.6rem;
		max-width: 80rem;
		margin: 0 auto;
	}
	.brand {
		font-weight: 600;
		text-decoration: none;
		color: var(--ink);
		letter-spacing: -0.01em;
	}
	.share {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.4rem 0.85rem;
		border-radius: 999px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: var(--paper);
		color: var(--ink);
		cursor: pointer;
	}
	.share:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	.grid {
		max-width: 80rem;
		margin: 0 auto;
		padding: 0.5rem 1.6rem 3rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 1.2rem;
	}
	.todo-fallback {
		color: var(--muted);
		font-size: 0.85rem;
		margin: 0;
	}
	.add-block {
		border-radius: 1.1rem;
		min-height: 14rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
	}
	.add-block.placeholder {
		font: inherit;
		align-items: center;
		justify-content: center;
		border: 2px dashed rgba(0, 0, 0, 0.12);
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		font-size: 0.95rem;
	}
	.add-block.placeholder:hover {
		border-color: rgba(0, 0, 0, 0.22);
		color: var(--ink);
		background: rgba(0, 0, 0, 0.02);
	}
	.add-block:not(.placeholder) {
		background: var(--paper);
		box-shadow:
			0 1px 0 rgba(0, 0, 0, 0.02),
			0 8px 24px -16px rgba(0, 0, 0, 0.18);
		justify-content: flex-start;
	}
	.kinds {
		display: flex;
		gap: 0.4rem;
	}
	.kinds button {
		flex: 1;
		font: inherit;
		font-size: 0.85rem;
		padding: 0.4rem;
		border-radius: 0.55rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(0, 0, 0, 0.03);
		color: var(--muted);
		cursor: pointer;
	}
	.kinds button.active {
		background: var(--ink);
		color: var(--paper);
		border-color: var(--ink);
	}
	.add-title {
		font: inherit;
		font-size: 0.95rem;
		padding: 0.5rem 0.65rem;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 0.55rem;
		outline: none;
	}
	.add-title:focus {
		border-color: var(--ink);
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.4rem;
	}
	.swatch {
		aspect-ratio: 1;
		border-radius: 50%;
		border: 2px solid transparent;
		background: var(--swatch);
		cursor: pointer;
		padding: 0;
		outline-offset: 2px;
	}
	.swatch.selected {
		border-color: var(--ink);
		box-shadow: 0 0 0 2px var(--paper) inset;
	}
	.add-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: auto;
	}
	.add-actions button {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.4rem 0.85rem;
		border-radius: 0.55rem;
		cursor: pointer;
		border: 1px solid transparent;
	}
	.add-actions .ghost {
		background: transparent;
		color: var(--muted);
	}
	.add-actions .primary {
		background: var(--ink);
		color: var(--paper);
	}
	.add-actions .primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
