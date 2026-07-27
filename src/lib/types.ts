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

// A notes-kind block holds a single free-text body (null for non-notes blocks).
export type BlockContent = Block & { todos: Todo[]; note: string | null };

export type BoardSnapshot = {
	board: Board;
	blocks: BlockContent[];
};
