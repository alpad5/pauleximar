import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addCalcItem, assertBlockBelongsToBoard } from '$lib/server/repo';
import { publish } from '$lib/server/realtime';

export const POST: RequestHandler = async ({ params, request }) => {
	const boardId = params.id;
	const body = await request.json().catch(() => null);
	const blockId = typeof body?.blockId === 'string' ? body.blockId : null;
	const text = typeof body?.text === 'string' ? body.text.trim() : '';
	const amount = typeof body?.amount === 'number' ? body.amount : NaN;

	if (!blockId || !text) throw error(400, 'blockId and text are required');
	if (text.length > 500) throw error(400, 'text too long');
	if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
		throw error(400, 'invalid amount');
	}

	if (!(await assertBlockBelongsToBoard(blockId, boardId))) {
		throw error(404, 'Block not found on this board');
	}

	const item = await addCalcItem(blockId, text, Math.round(amount * 100) / 100);
	publish(boardId, { type: 'calc_item_added', item });
	return json(item);
};
