import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getBoardSnapshot } from '$lib/server/repo';

export const load: PageServerLoad = async ({ params }) => {
	const snapshot = await getBoardSnapshot(params.id);
	if (!snapshot) throw error(404, 'Tablero no encontrado');
	return { snapshot };
};
