export type BlockKind = 'todos' | 'notes' | 'grocery' | 'messages';

export type Board = {
	id: string;
	created_at: string;
};

export type Block = {
	id: string;
	board_id: string;
	kind: BlockKind;
	title: string;
	color: string;
	position: number;
};

export type Todo = {
	id: string;
	block_id: string;
	text: string;
	done: boolean;
	position: number;
	created_at: string;
};

export type BoardSnapshot = {
	board: Board;
	blocks: Array<Block & { todos: Todo[] }>;
};
