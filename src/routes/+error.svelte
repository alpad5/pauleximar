<script lang="ts">
	import { page } from '$app/state';
</script>

<main>
	<div class="card">
		<h1>{page.status}</h1>
		<p>{page.error?.message ?? 'algo salió mal'}</p>
		<a href="/">← volver al inicio</a>
	</div>
</main>

<style>
	main {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 2rem;
	}
	.card {
		text-align: center;
	}
	h1 {
		font-size: 3rem;
		margin: 0 0 0.4rem;
		font-weight: 600;
		letter-spacing: -0.03em;
	}
	p {
		color: var(--muted);
		margin: 0 0 1.4rem;
	}
	a {
		font-size: 0.9rem;
		color: var(--muted);
		text-decoration: none;
		border-bottom: 1px dotted currentColor;
	}
	a:hover {
		color: var(--ink);
	}
</style>
