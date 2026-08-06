import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { boardExists, createBlock, reorderBlocks } from '$lib/server/repo';
import { publish } from '$lib/server/realtime';
import { isPaletteColor } from '$lib/palette';
import type { BlockKind } from '$lib/types';

const CREATABLE_KINDS: BlockKind[] = ['todos', 'notes', 'prioridades'];

export const POST: RequestHandler = async ({ params, request }) => {
	const boardId = params.id;
	const body = await request.json().catch(() => null);

	const kind = body?.kind as BlockKind;
	if (!CREATABLE_KINDS.includes(kind)) throw error(400, 'invalid block kind');

	const title = typeof body?.title === 'string' ? body.title.trim() : '';
	if (!title) throw error(400, 'title required');
	if (title.length > 80) throw error(400, 'title too long');

	const color = body?.color;
	if (!isPaletteColor(color)) throw error(400, 'invalid color');

	if (!(await boardExists(boardId))) throw error(404, 'Board not found');

	const block = await createBlock(boardId, kind, title, color);
	publish(boardId, { type: 'block_added', block });
	return json(block);
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reorder the board's blocks. Body: `{ order: string[] }`, the full block id list. */
export const PATCH: RequestHandler = async ({ params, request }) => {
	const boardId = params.id;
	const body = await request.json().catch(() => null);

	const order = body?.order;
	if (!Array.isArray(order) || order.length === 0) throw error(400, 'order required');
	if (order.length > 200) throw error(400, 'order too long');
	// Guard the ::uuid[] cast, and reject duplicates — they'd give two blocks the
	// same position and make the resulting order arbitrary.
	if (!order.every((id) => typeof id === 'string' && UUID.test(id))) {
		throw error(400, 'order must be block ids');
	}
	if (new Set(order).size !== order.length) throw error(400, 'duplicate ids in order');

	const moved = await reorderBlocks(boardId, order);
	if (moved === 0) throw error(404, 'no blocks matched this board');

	publish(boardId, { type: 'blocks_reordered', order });
	return json({ ok: true, moved });
};
