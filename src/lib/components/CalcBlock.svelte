<script lang="ts">
	import type { CalcItem } from '$lib/types';
	import { PAYER_CYCLE, payerColor, payerTitle, formatMoney } from '$lib/calc';
	import { hits } from '$lib/search';
	import Mark from './Mark.svelte';

	type Props = {
		blockId: string;
		boardId: string;
		items: CalcItem[];
		/** Folded search query; when set, the list narrows to matching items. */
		query?: string;
	};

	let { blockId, boardId, items, query = '' }: Props = $props();

	const sorted = $derived(
		[...items]
			.filter((i) => !query || hits(i.text, query))
			.sort((a, b) => a.position - b.position)
	);

	let draftText = $state('');
	let draftAmount = $state('');
	let submitting = $state(false);

	async function patchItem(id: string, body: Record<string, unknown>) {
		await fetch(`/b/${boardId}/api/calc/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
	}

	async function addItem() {
		const text = draftText.trim();
		const amount = parseFloat(draftAmount.replace(',', '.'));
		if (!text || !Number.isFinite(amount) || amount < 0 || submitting) return;
		submitting = true;
		const prevText = draftText;
		const prevAmount = draftAmount;
		draftText = '';
		draftAmount = '';
		try {
			const res = await fetch(`/b/${boardId}/api/calc`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ blockId, text, amount })
			});
			if (!res.ok) {
				draftText = prevText;
				draftAmount = prevAmount;
			}
		} catch {
			draftText = prevText;
			draftAmount = prevAmount;
		} finally {
			submitting = false;
		}
	}

	function cycle(item: CalcItem) {
		const next = PAYER_CYCLE[(PAYER_CYCLE.indexOf(item.payer) + 1) % PAYER_CYCLE.length];
		patchItem(item.id, { payer: next });
	}

	async function remove(item: CalcItem) {
		await fetch(`/b/${boardId}/api/calc/${item.id}`, { method: 'DELETE' });
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addItem();
		}
	}
</script>

<ul class="list">
	{#each sorted as item (item.id)}
		<li>
			<button
				class="payer"
				class:none={!item.payer}
				style="--payer: {payerColor(item.payer)};"
				onclick={() => cycle(item)}
				title={payerTitle(item.payer)}
				aria-label={payerTitle(item.payer)}
			></button>
			<span class="text"><Mark text={item.text} {query} /></span>
			<span class="amount">{formatMoney(item.amount)}</span>
			<button class="remove" onclick={() => remove(item)} aria-label="Eliminar">×</button>
		</li>
	{:else}
		<li class="empty">{query ? 'sin coincidencias aquí' : 'sin gastos todavía'}</li>
	{/each}
</ul>

{#if !query}
	<form
		class="add"
		onsubmit={(e) => {
			e.preventDefault();
			addItem();
		}}
	>
		<input
			type="text"
			placeholder="qué compraste"
			bind:value={draftText}
			onkeydown={onKeydown}
			maxlength="500"
		/>
		<input
			class="amount-input"
			type="text"
			inputmode="decimal"
			placeholder="0,00"
			bind:value={draftAmount}
			onkeydown={onKeydown}
		/>
		<button
			type="submit"
			disabled={!draftText.trim() || !draftAmount.trim() || submitting}
			aria-label="Añadir">+</button
		>
	</form>
{/if}

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
	.payer {
		flex-shrink: 0;
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 50%;
		border: none;
		padding: 0;
		cursor: pointer;
		background: var(--payer);
	}
	.payer.none {
		background: transparent;
		border: 1.5px solid rgba(0, 0, 0, 0.2);
	}
	.payer.none:hover {
		border-color: var(--ink);
	}
	.text {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.amount {
		flex-shrink: 0;
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.remove {
		flex-shrink: 0;
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
		font: inherit;
		font-size: 0.9rem;
		padding: 0.45rem 0.6rem;
		border: 1px solid transparent;
		background: rgba(0, 0, 0, 0.04);
		border-radius: 0.55rem;
		outline: none;
		min-width: 0;
	}
	.add input[type='text']:not(.amount-input) {
		flex: 1;
	}
	.amount-input {
		width: 4.5rem;
		flex-shrink: 0;
		text-align: right;
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
