import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addTodo, assertBlockBelongsToBoard } from '$lib/server/repo';
import { publish } from '$lib/server/realtime';

export const POST: RequestHandler = async ({ params, request }) => {
	const boardId = params.id;
	const body = await request.json().catch(() => null);
	const blockId = typeof body?.blockId === 'string' ? body.blockId : null;
	const text = typeof body?.text === 'string' ? body.text.trim() : '';

	if (!blockId || !text) throw error(400, 'blockId and text are required');
	if (text.length > 500) throw error(400, 'text too long');

	if (!(await assertBlockBelongsToBoard(blockId, boardId))) {
		throw error(404, 'Block not found on this board');
	}

	const todo = await addTodo(blockId, text);
	publish(boardId, { type: 'todo_added', todo });
	return json(todo);
};
