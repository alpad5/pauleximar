<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Block from '$lib/components/Block.svelte';
	import TodoBlock from '$lib/components/TodoBlock.svelte';
	import type { PageData } from './$types';
	import type { BoardEvent } from '$lib/server/realtime';
	import type { Todo, Block as BlockType } from '$lib/types';

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
			'block_renamed'
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
</script>

<svelte:head>
	<title>pauleximar — board</title>
</svelte:head>

<header class="topbar">
	<a href="/" class="brand">pauleximar</a>
	<button class="share" onclick={copyLink}>
		{copied ? 'copied ✓' : 'copy share link'}
	</button>
</header>

<main class="grid">
	{#each blocks as block (block.id)}
		<Block {block} {boardId}>
			{#if block.kind === 'todos'}
				<TodoBlock blockId={block.id} {boardId} todos={block.todos} />
			{:else}
				<p class="todo-fallback">block kind "{block.kind}" not implemented yet</p>
			{/if}
		</Block>
	{/each}
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
</style>
