<script lang="ts">
	import { onMount } from 'svelte';
	import Logo from '$lib/components/Logo.svelte';

	let savedBoardId = $state<string | null>(null);

	onMount(() => {
		savedBoardId = localStorage.getItem('bavardage:lastBoard');
	});
</script>

<svelte:head>
	<title>bavardage</title>
</svelte:head>

<main class="landing">
	<div class="card">
		<Logo size={44} />
		<h1>bavardage</h1>
		<p class="subtitle">un pequeño tablero compartido para dos</p>

		<form method="POST" action="?/create">
			<button type="submit" class="primary">Crear un tablero nuevo</button>
		</form>

		{#if savedBoardId}
			<a class="resume" href={`/b/${savedBoardId}`}>volver a tu último tablero →</a>
		{/if}

		<p class="hint">
			Después de crearlo, guarda la URL y compártela con tu pareja. Quien tenga el enlace, entra.
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
		margin: 0.9rem 0 0.25rem;
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
