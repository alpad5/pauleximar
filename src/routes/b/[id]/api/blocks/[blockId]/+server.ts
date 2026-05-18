import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { renameBlock } from '$lib/server/repo';
import { publish } from '$lib/server/realtime';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => null);
	const title = typeof body?.title === 'string' ? body.title.trim() : '';
	if (!title) throw error(400, 'title required');
	if (title.length > 80) throw error(400, 'title too long');

	const ok = await renameBlock(params.blockId, title, params.id);
	if (!ok) throw error(404, 'Block not found on this board');

	publish(params.id, { type: 'block_renamed', block: { id: params.blockId, title } });
	return json({ ok: true });
};
