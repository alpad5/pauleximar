import { sql } from './db';
import type { Board, Block, Todo, BoardSnapshot } from '$lib/types';

const DEFAULT_TODOS_COLOR = '#f4c95d';

export async function createBoard(): Promise<Board> {
	const [board] = await sql<Board[]>`
		insert into boards default values
		returning id, created_at
	`;
	await sql`
		insert into blocks (board_id, kind, title, color, position)
		values (${board.id}, 'todos', 'Todos', ${DEFAULT_TODOS_COLOR}, 0)
	`;
	return board;
}

export async function boardExists(id: string): Promise<boolean> {
	const rows = await sql`select 1 from boards where id = ${id} limit 1`;
	return rows.length > 0;
}

export async function getBoardSnapshot(boardId: string): Promise<BoardSnapshot | null> {
	const boards = await sql<Board[]>`
		select id, created_at from boards where id = ${boardId}
	`;
	if (boards.length === 0) return null;

	const blocks = await sql<Block[]>`
		select id, board_id, kind, title, color, position
		from blocks
		where board_id = ${boardId}
		order by position, id
	`;

	const todos = await sql<Todo[]>`
		select id, block_id, text, done, position, created_at
		from todos
		where block_id in ${sql(blocks.map((b) => b.id))}
		order by position, created_at
	`;

	const todosByBlock = new Map<string, Todo[]>();
	for (const t of todos) {
		const list = todosByBlock.get(t.block_id) ?? [];
		list.push(t);
		todosByBlock.set(t.block_id, list);
	}

	return {
		board: boards[0],
		blocks: blocks.map((b) => ({ ...b, todos: todosByBlock.get(b.id) ?? [] }))
	};
}

export async function assertBlockBelongsToBoard(blockId: string, boardId: string): Promise<boolean> {
	const rows = await sql`
		select 1 from blocks where id = ${blockId} and board_id = ${boardId} limit 1
	`;
	return rows.length > 0;
}

export async function addTodo(blockId: string, text: string): Promise<Todo> {
	const [todo] = await sql<Todo[]>`
		insert into todos (block_id, text, position)
		values (
			${blockId},
			${text},
			coalesce((select max(position) + 1 from todos where block_id = ${blockId}), 0)
		)
		returning id, block_id, text, done, position, created_at
	`;
	return todo;
}

export async function setTodoDone(todoId: string, done: boolean, boardId: string): Promise<Todo | null> {
	const [todo] = await sql<Todo[]>`
		update todos
		set done = ${done}
		where id = ${todoId}
		  and block_id in (select id from blocks where board_id = ${boardId})
		returning id, block_id, text, done, position, created_at
	`;
	return todo ?? null;
}

export async function deleteTodo(
	todoId: string,
	boardId: string
): Promise<{ id: string; block_id: string } | null> {
	const rows = await sql<{ id: string; block_id: string }[]>`
		delete from todos
		where id = ${todoId}
		  and block_id in (select id from blocks where board_id = ${boardId})
		returning id, block_id
	`;
	return rows[0] ?? null;
}

export async function renameBlock(blockId: string, title: string, boardId: string): Promise<boolean> {
	const rows = await sql`
		update blocks
		set title = ${title}
		where id = ${blockId} and board_id = ${boardId}
		returning id
	`;
	return rows.length > 0;
}
