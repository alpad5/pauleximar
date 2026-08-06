import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { renameBlock, deleteBlock, setBlockSpan } from '$lib/server/repo';
import { publish } from '$lib/server/realtime';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => null);

	// Width toggle. Null clears the preference and restores the mosaic default.
	if (body && 'span' in body) {
		const span = body.span;
		if (span !== null && span !== 1 && span !== 2) throw error(400, 'span must be 1, 2 or null');

		const ok = await setBlockSpan(params.blockId, span, params.id);
		if (!ok) throw error(404, 'Block not found on this board');

		publish(params.id, { type: 'block_resized', id: params.blockId, span });
		return json({ ok: true });
	}

	const title = typeof body?.title === 'string' ? body.title.trim() : '';
	if (!title) throw error(400, 'title required');
	if (title.length > 80) throw error(400, 'title too long');

	const ok = await renameBlock(params.blockId, title, params.id);
	if (!ok) throw error(404, 'Block not found on this board');

	publish(params.id, { type: 'block_renamed', block: { id: params.blockId, title } });
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const ok = await deleteBlock(params.blockId, params.id);
	if (!ok) throw error(404, 'Block not found on this board');

	publish(params.id, { type: 'block_deleted', id: params.blockId });
	return json({ ok: true });
};
