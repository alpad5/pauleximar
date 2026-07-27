<script lang="ts">
	import { NOTE_PLACEHOLDERS, pickFrom } from '$lib/phrases';

	type Props = {
		blockId: string;
		boardId: string;
		body: string;
	};

	let { blockId, boardId, body }: Props = $props();

	// blockId is a stable prop; reading it once to seed the phrase is intentional.
	// svelte-ignore state_referenced_locally
	const placeholder = pickFrom(NOTE_PLACEHOLDERS, blockId);

	// Seed from the prop once; thereafter `draft` is the source of truth while the
	// user edits, re-synced only when the prop itself changes (a remote update).
	// svelte-ignore state_referenced_locally
	let draft = $state(body);
	// svelte-ignore state_referenced_locally
	let seen = $state(body);
	let focused = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Adopt a remote change only when the incoming prop actually changed (not on
	// every keystroke) and the user isn't mid-edit — otherwise typing gets clobbered.
	$effect(() => {
		if (body !== seen) {
			seen = body;
			if (!focused) draft = body;
		}
	});

	async function save() {
		try {
			await fetch(`/b/${boardId}/api/notes/${blockId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ body: draft })
			});
		} catch {
			// keep the draft; next edit retries
		}
	}

	function onInput() {
		clearTimeout(timer);
		timer = setTimeout(save, 500);
	}

	function onBlur() {
		focused = false;
		clearTimeout(timer);
		save();
	}
</script>

<textarea
	class="note"
	bind:value={draft}
	oninput={onInput}
	onfocus={() => (focused = true)}
	onblur={onBlur}
	{placeholder}
	maxlength="10000"
></textarea>

<style>
	.note {
		flex: 1;
		width: 100%;
		resize: none;
		font: inherit;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--ink);
		background: transparent;
		border: none;
		outline: none;
		padding: 0;
		min-height: 8rem;
	}
	.note::placeholder {
		color: var(--muted);
		font-style: italic;
	}
</style>
