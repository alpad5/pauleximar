import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCalcItem, deleteCalcItem, type CalcItemPatch } from '$lib/server/repo';
import { publish } from '$lib/server/realtime';

const PAYERS = ['a', 'b'];

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => null);

	const patch: CalcItemPatch = {};
	if (typeof body?.text === 'string') {
		const text = body.text.trim();
		if (!text) throw error(400, 'text cannot be empty');
		if (text.length > 500) throw error(400, 'text too long');
		patch.text = text;
	}
	if (typeof body?.amount === 'number') {
		if (!Number.isFinite(body.amount) || body.amount < 0 || body.amount > 1_000_000) {
			throw error(400, 'invalid amount');
		}
		patch.amount = Math.round(body.amount * 100) / 100;
	}
	if ('payer' in (body ?? {})) {
		const p = body.payer;
		if (p !== null && !PAYERS.includes(p)) throw error(400, 'invalid payer');
		patch.payer = p;
	}
	if (Object.keys(patch).length === 0) throw error(400, 'no valid fields to update');

	const item = await updateCalcItem(params.itemId, patch, params.id);
	if (!item) throw error(404, 'Item not found on this board');

	publish(params.id, { type: 'calc_item_updated', item });
	return json(item);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const deleted = await deleteCalcItem(params.itemId, params.id);
	if (!deleted) throw error(404, 'Item not found on this board');

	publish(params.id, { type: 'calc_item_deleted', id: deleted.id, block_id: deleted.block_id });
	return json({ ok: true });
};
