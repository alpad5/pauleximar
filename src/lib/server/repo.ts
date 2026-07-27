import { sql } from './db';
import type { Board, Block, BlockKind, Priority, Todo, BoardSnapshot } from '$lib/types';

// Columns for a full Todo row; due_date is normalised to a 'YYYY-MM-DD' string.
const TODO_COLS = sql`id, block_id, text, done, position, priority, to_char(due_date, 'YYYY-MM-DD') as due_date, created_at`;

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

	const blockIds = blocks.map((b) => b.id);

	const todos = await sql<Todo[]>`
		select ${TODO_COLS}
		from todos
		where block_id in ${sql(blockIds)}
		order by position, created_at
	`;

	const notes = await sql<{ block_id: string; body: string }[]>`
		select block_id, body from notes where block_id in ${sql(blockIds)}
	`;

	const todosByBlock = new Map<string, Todo[]>();
	for (const t of todos) {
		const list = todosByBlock.get(t.block_id) ?? [];
		list.push(t);
		todosByBlock.set(t.block_id, list);
	}

	const noteByBlock = new Map<string, string>();
	for (const n of notes) noteByBlock.set(n.block_id, n.body);

	return {
		board: boards[0],
		blocks: blocks.map((b) => ({
			...b,
			todos: todosByBlock.get(b.id) ?? [],
			note: noteByBlock.get(b.id) ?? null
		}))
	};
}

export async function createBlock(
	boardId: string,
	kind: BlockKind,
	title: string,
	color: string
): Promise<Block & { note: string | null }> {
	const [block] = await sql<Block[]>`
		insert into blocks (board_id, kind, title, color, position)
		values (
			${boardId},
			${kind},
			${title},
			${color},
			coalesce((select max(position) + 1 from blocks where board_id = ${boardId}), 0)
		)
		returning id, board_id, kind, title, color, position
	`;
	if (kind === 'notes') {
		await sql`insert into notes (block_id, body) values (${block.id}, '')`;
		return { ...block, note: '' };
	}
	return { ...block, note: null };
}

export async function setNote(
	blockId: string,
	body: string,
	boardId: string
): Promise<string | null> {
	const rows = await sql<{ body: string }[]>`
		update notes
		set body = ${body}, updated_at = now()
		where block_id = ${blockId}
		  and block_id in (select id from blocks where board_id = ${boardId} and kind = 'notes')
		returning body
	`;
	return rows[0]?.body ?? null;
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
		returning ${TODO_COLS}
	`;
	return todo;
}

export type TodoPatch = {
	done?: boolean;
	priority?: Priority | null;
	due_date?: string | null;
};

export async function updateTodo(
	todoId: string,
	patch: TodoPatch,
	boardId: string
): Promise<Todo | null> {
	const [todo] = await sql<Todo[]>`
		update todos
		set ${sql(patch as Record<string, unknown>)}
		where id = ${todoId}
		  and block_id in (select id from blocks where board_id = ${boardId})
		returning ${TODO_COLS}
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

export async function deleteBlock(blockId: string, boardId: string): Promise<boolean> {
	// todos/notes rows are removed via ON DELETE CASCADE.
	const rows = await sql`
		delete from blocks
		where id = ${blockId} and board_id = ${boardId}
		returning id
	`;
	return rows.length > 0;
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
