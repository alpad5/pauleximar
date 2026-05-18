<script lang="ts">
	import { onMount } from 'svelte';

	let savedBoardId = $state<string | null>(null);

	onMount(() => {
		savedBoardId = localStorage.getItem('pauleximar:lastBoard');
	});
</script>

<svelte:head>
	<title>pauleximar</title>
</svelte:head>

<main class="landing">
	<div class="card">
		<h1>pauleximar</h1>
		<p class="subtitle">a tiny shared board for two</p>

		<form method="POST" action="?/create">
			<button type="submit" class="primary">Create a new board</button>
		</form>

		{#if savedBoardId}
			<a class="resume" href={`/b/${savedBoardId}`}>resume your last board →</a>
		{/if}

		<p class="hint">
			After creating, bookmark the URL and share it with your partner. Whoever has the link is in.
		</p>
	</div>
</main>

<style>
	.landing {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 2rem;
	}
	.card {
		max-width: 28rem;
		text-align: center;
		padding: 2.5rem 2rem;
	}
	h1 {
		margin: 0 0 0.25rem;
		font-size: 2rem;
		letter-spacing: -0.02em;
	}
	.subtitle {
		margin: 0 0 2rem;
		color: var(--muted);
		font-size: 0.95rem;
	}
	.primary {
		font: inherit;
		padding: 0.7rem 1.4rem;
		border-radius: 999px;
		border: none;
		background: var(--ink);
		color: var(--paper);
		cursor: pointer;
		transition: transform 0.08s ease;
	}
	.primary:hover {
		transform: translateY(-1px);
	}
	.resume {
		display: inline-block;
		margin-top: 1.2rem;
		font-size: 0.9rem;
		color: var(--muted);
		text-decoration: none;
		border-bottom: 1px dotted currentColor;
	}
	.resume:hover {
		color: var(--ink);
	}
	.hint {
		margin: 2rem 0 0;
		font-size: 0.8rem;
		color: var(--muted);
		line-height: 1.5;
	}
</style>
