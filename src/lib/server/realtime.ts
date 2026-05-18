import type { Block, Todo } from '$lib/types';

export type BoardEvent =
	| { type: 'todo_added'; todo: Todo }
	| { type: 'todo_updated'; todo: Todo }
	| { type: 'todo_deleted'; id: string; block_id: string }
	| { type: 'block_renamed'; block: Pick<Block, 'id' | 'title'> };

type Handler = (event: BoardEvent) => void;

const subscribers = new Map<string, Set<Handler>>();

export function subscribe(boardId: string, handler: Handler): () => void {
	let set = subscribers.get(boardId);
	if (!set) {
		set = new Set();
		subscribers.set(boardId, set);
	}
	set.add(handler);
	return () => {
		const current = subscribers.get(boardId);
		if (!current) return;
		current.delete(handler);
		if (current.size === 0) subscribers.delete(boardId);
	};
}

export function publish(boardId: string, event: BoardEvent): void {
	const set = subscribers.get(boardId);
	if (!set) return;
	for (const handler of set) {
		try {
			handler(event);
		} catch {
			// Drop subscribers that throw; the SSE controller has likely closed.
		}
	}
}
