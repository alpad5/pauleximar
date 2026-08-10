<script lang="ts">
	import type { CalcItem } from '$lib/types';
	import { payerColor, formatMoney, settle } from '$lib/calc';

	type Props = { items: CalcItem[] };

	let { items }: Props = $props();

	const result = $derived(settle(items));
</script>

<div class="results">
	<div class="totals">
		<span class="total" style="--payer: {payerColor('a')};">
			<span class="dot"></span>{formatMoney(result.totalA)}
		</span>
		<span class="total" style="--payer: {payerColor('b')};">
			<span class="dot"></span>{formatMoney(result.totalB)}
		</span>
	</div>
	<p class="settle">
		{#if items.length === 0}
			sin gastos todavía
		{:else if result.owes === null}
			cuentas ajustadas
		{:else}
			<span class="dot" style="--payer: {payerColor(result.owes)};"></span>
			debe {formatMoney(result.amount)}
			<span class="dot" style="--payer: {payerColor(result.owes === 'a' ? 'b' : 'a')};"></span>
		{/if}
	</p>
</div>

<style>
	.results {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.totals {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.total {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 600;
		font-size: 1.05rem;
	}
	.dot {
		flex-shrink: 0;
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--payer);
		border: 1.5px solid rgba(0, 0, 0, 0.18);
	}
	.settle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0;
		font-size: 0.9rem;
		color: var(--muted);
	}
</style>
