<script lang="ts">
	import type { Todo } from '$lib/types';
	import { TODO_PLACEHOLDERS, TODO_EMPTY, pickFrom } from '$lib/phrases';
	import { PRIORITY_CYCLE, priColor, priTitle, comparePriority, dueLabel } from '$lib/priority';

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
	let dueOpenId = $state<string | null>(null);

	// Completed tasks sink to the bottom; among active ones, priority rises to the
	// top, then earliest due date, then original order.
	const sorted = $derived(
		[...todos].sort((a, b) => {
			if (a.done !== b.done) return a.done ? 1 : -1;
			return comparePriority(a, b);
		})
	);

	async function patchTodo(id: string, body: Record<string, unknown>) {
		await fetch(`/b/${boardId}/api/todos/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
	}

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

	function toggle(todo: Todo) {
		patchTodo(todo.id, { done: !todo.done });
	}

	function cycle(todo: Todo) {
		const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(todo.priority) + 1) % PRIORITY_CYCLE.length];
		patchTodo(todo.id, { priority: next });
	}

	function setDue(todo: Todo, value: string) {
		dueOpenId = null;
		patchTodo(todo.id, { due_date: value || null });
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
	{#each sorted as todo (todo.id)}
		<li class:done={todo.done} style="--pri: {priColor(todo.priority)};">
			<label>
				<input type="checkbox" checked={todo.done} onchange={() => toggle(todo)} />
				<span class="text">{todo.text}</span>
			</label>
			{#if dueOpenId === todo.id}
				<!-- svelte-ignore a11y_autofocus -->
				<input
					class="date"
					type="date"
					value={todo.due_date ?? ''}
					onchange={(e) => setDue(todo, e.currentTarget.value)}
					onblur={() => (dueOpenId = null)}
					autofocus
				/>
			{:else if todo.due_date}
				<button
					class="due {dueLabel(todo.due_date).state}"
					onclick={() => (dueOpenId = todo.id)}
					title="Cambiar fecha límite"
				>
					{dueLabel(todo.due_date).text}
				</button>
			{:else}
				<button
					class="cal"
					onclick={() => (dueOpenId = todo.id)}
					title="Añadir fecha límite"
					aria-label="Añadir fecha límite">📅</button
				>
			{/if}
			<button class="remove" onclick={() => remove(todo)} aria-label="Eliminar">×</button>
			<button
				class="pri"
				class:none={!todo.priority}
				onclick={() => cycle(todo)}
				title={priTitle(todo.priority)}
				aria-label={priTitle(todo.priority)}
			></button>
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
		gap: 0.45rem;
		padding: 0.25rem 0.4rem;
		border-left: 3px solid var(--pri);
		border-radius: 0 0.5rem 0.5rem 0;
		font-size: 0.92rem;
	}
	.list li:hover {
		background: rgba(0, 0, 0, 0.03);
	}
	.list li:hover .remove,
	.list li:hover .cal {
		opacity: 1;
	}
	.list li.empty {
		color: var(--muted);
		font-style: italic;
		font-size: 0.85rem;
		padding-left: 0.4rem;
		border-left-color: transparent;
	}
	.pri {
		flex-shrink: 0;
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 50%;
		border: none;
		padding: 0;
		cursor: pointer;
		background: var(--pri);
	}
	.pri.none {
		background: transparent;
		border: 1.5px solid rgba(0, 0, 0, 0.2);
	}
	.pri.none:hover {
		border-color: var(--ink);
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
	.due {
		flex-shrink: 0;
		font: inherit;
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		border: none;
		cursor: pointer;
		background: rgba(0, 0, 0, 0.06);
		color: var(--muted);
	}
	.due.today,
	.due.soon {
		background: color-mix(in srgb, #e0a34e 22%, var(--paper));
		color: #a66a12;
	}
	.due.overdue {
		background: color-mix(in srgb, #e05a4d 22%, var(--paper));
		color: #b02a1d;
	}
	.date {
		font: inherit;
		font-size: 0.78rem;
		padding: 0.1rem 0.2rem;
		border: 1px solid var(--accent);
		border-radius: 0.4rem;
		background: var(--paper);
		color: var(--ink);
	}
	.cal {
		flex-shrink: 0;
		border: none;
		background: transparent;
		font-size: 0.85rem;
		line-height: 1;
		padding: 0.1rem 0.2rem;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.12s;
		filter: grayscale(0.4);
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
