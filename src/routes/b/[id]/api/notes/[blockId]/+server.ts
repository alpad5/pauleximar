import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setNote } from '$lib/server/repo';
import { publish } from '$lib/server/realtime';

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => null);
	if (typeof body?.body !== 'string') throw error(400, 'body (string) required');
	if (body.body.length > 10000) throw error(400, 'note too long');

	const saved = await setNote(params.blockId, body.body, params.id);
	if (saved === null) throw error(404, 'Notes block not found on this board');

	publish(params.id, { type: 'note_updated', block_id: params.blockId, body: saved });
	return json({ ok: true });
};
