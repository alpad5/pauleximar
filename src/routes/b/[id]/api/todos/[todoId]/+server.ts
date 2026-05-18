import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setTodoDone, deleteTodo } from '$lib/server/repo';
import { publish } from '$lib/server/realtime';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => null);
	if (typeof body?.done !== 'boolean') throw error(400, 'done (boolean) required');

	const todo = await setTodoDone(params.todoId, body.done, params.id);
	if (!todo) throw error(404, 'Todo not found on this board');

	publish(params.id, { type: 'todo_updated', todo });
	return json(todo);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const deleted = await deleteTodo(params.todoId, params.id);
	if (!deleted) throw error(404, 'Todo not found on this board');

	publish(params.id, { type: 'todo_deleted', id: deleted.id, block_id: deleted.block_id });
	return json({ ok: true });
};
