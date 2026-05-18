import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createBoard } from '$lib/server/repo';

export const actions: Actions = {
	create: async () => {
		const board = await createBoard();
		redirect(303, `/b/${board.id}`);
	}
};
