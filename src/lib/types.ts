export type BlockKind = 'todos' | 'notes' | 'grocery' | 'messages' | 'prioridades';

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
	/** Column width, 1 or 2. Null = no preference; the UI picks a mosaic width. */
	span: number | null;
};

export type Priority = 'alta' | 'media' | 'baja';

export type Todo = {
	id: string;
	block_id: string;
	text: string;
	done: boolean;
	position: number;
	created_at: string;
	priority: Priority | null;
	due_date: string | null; // 'YYYY-MM-DD' or null
};

// A notes-kind block holds a single free-text body (null for non-notes blocks).
export type BlockContent = Block & { todos: Todo[]; note: string | null };

export type BoardSnapshot = {
	board: Board;
	blocks: BlockContent[];
};
