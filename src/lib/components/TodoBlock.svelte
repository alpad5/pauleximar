<script lang="ts">
	import type { Todo } from '$lib/types';
	import { TODO_PLACEHOLDERS, TODO_EMPTY, pickFrom } from '$lib/phrases';

	type Props = {
		blockId: string;
		boardId: string;
		todos: Todo[];
	};

	let { blockId, boardId, todos }: Props = $props();

	// blockId is a stable prop; reading it once to seed the phrase is intentional.
	// svelte-ignore state_referenced_locally
	const placeholder = pickFrom(TODO_PLACEHOLDERS, blockId);
	// svelte-ignore state_referenced_locally
	const emptyText = pickFrom(TODO_EMPTY, blockId + '·empty');

	let draft = $state('');
	let submitting = $state(false);

	async function addItem() {
		const text = draft.trim();
		if (!text || submitting) return;
		submitting = true;
		const prev = draft;
		draft = '';
		try {
			const res = await fetch(`/b/${boardId}/api/todos`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ blockId, text })
			});
			if (!res.ok) draft = prev;
		} catch {
			draft = prev;
		} finally {
			submitting = false;
		}
	}

	async function toggle(todo: Todo) {
		await fetch(`/b/${boardId}/api/todos/${todo.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ done: !todo.done })
		});
	}

	async function remove(todo: Todo) {
		await fetch(`/b/${boardId}/api/todos/${todo.id}`, { method: 'DELETE' });
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addItem();
		}
	}
</script>

<ul class="list">
	{#each todos as todo (todo.id)}
		<li class:done={todo.done}>
			<label>
				<input type="checkbox" checked={todo.done} onchange={() => toggle(todo)} />
				<span class="text">{todo.text}</span>
			</label>
			<button class="remove" onclick={() => remove(todo)} aria-label="Eliminar">×</button>
		</li>
	{:else}
		<li class="empty">{emptyText}</li>
	{/each}
</ul>

<form
	class="add"
	onsubmit={(e) => {
		e.preventDefault();
		addItem();
	}}
>
	<input
		type="text"
		placeholder={placeholder}
		bind:value={draft}
		onkeydown={onKeydown}
		maxlength="500"
	/>
	<button type="submit" disabled={!draft.trim() || submitting} aria-label="Añadir">+</button>
</form>

<style>
	.list {
		list-style: none;
		padding: 0;
		margin: 0 0 0.75rem;
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.list li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.4rem;
		border-radius: 0.5rem;
		font-size: 0.92rem;
	}
	.list li:hover {
		background: rgba(0, 0, 0, 0.03);
	}
	.list li:hover .remove {
		opacity: 1;
	}
	.list li.empty {
		color: var(--muted);
		font-style: italic;
		font-size: 0.85rem;
		padding-left: 0.4rem;
	}
	label {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		flex: 1;
		cursor: pointer;
		min-width: 0;
	}
	input[type='checkbox'] {
		accent-color: var(--accent);
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}
	.text {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	li.done .text {
		color: var(--muted);
		text-decoration: line-through;
	}
	.remove {
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: 1.1rem;
		line-height: 1;
		padding: 0.15rem 0.4rem;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.12s;
		border-radius: 0.3rem;
	}
	.remove:hover {
		background: rgba(0, 0, 0, 0.06);
		color: var(--ink);
	}
	.add {
		display: flex;
		gap: 0.4rem;
		margin-top: auto;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.05);
	}
	.add input {
		flex: 1;
		font: inherit;
		font-size: 0.9rem;
		padding: 0.45rem 0.6rem;
		border: 1px solid transparent;
		background: rgba(0, 0, 0, 0.04);
		border-radius: 0.55rem;
		outline: none;
		min-width: 0;
	}
	.add input:focus {
		background: var(--paper);
		border-color: var(--accent);
	}
	.add button {
		font: inherit;
		width: 2rem;
		height: 2rem;
		border-radius: 0.55rem;
		border: none;
		background: var(--accent);
		color: var(--paper);
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		flex-shrink: 0;
	}
	.add button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
