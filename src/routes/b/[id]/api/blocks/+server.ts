import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { boardExists, createBlock } from '$lib/server/repo';
import { publish } from '$lib/server/realtime';
import { isPaletteColor } from '$lib/palette';
import type { BlockKind } from '$lib/types';

const CREATABLE_KINDS: BlockKind[] = ['todos', 'notes'];

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
