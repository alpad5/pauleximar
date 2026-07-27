import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateTodo, deleteTodo, type TodoPatch } from '$lib/server/repo';
import { publish } from '$lib/server/realtime';

const PRIORITIES = ['alta', 'media', 'baja'];

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => null);

	const patch: TodoPatch = {};
	if (typeof body?.done === 'boolean') patch.done = body.done;
	if ('priority' in (body ?? {})) {
		const p = body.priority;
		if (p !== null && !PRIORITIES.includes(p)) throw error(400, 'invalid priority');
		patch.priority = p;
	}
	if ('due_date' in (body ?? {})) {
		const d = body.due_date;
		if (d !== null && !(typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))) {
			throw error(400, 'invalid due_date');
		}
		patch.due_date = d;
	}
	if (Object.keys(patch).length === 0) throw error(400, 'no valid fields to update');

	const todo = await updateTodo(params.todoId, patch, params.id);
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
