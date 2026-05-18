import type { RequestHandler } from './$types';
import { boardExists } from '$lib/server/repo';
import { subscribe } from '$lib/server/realtime';
import { error } from '@sveltejs/kit';

const KEEPALIVE_MS = 25_000;

export const GET: RequestHandler = async ({ params, request }) => {
	const boardId = params.id;
	if (!(await boardExists(boardId))) {
		throw error(404, 'Board not found');
	}

	const encoder = new TextEncoder();
	let unsubscribe: (() => void) | null = null;
	let keepalive: ReturnType<typeof setInterval> | null = null;

	const stream = new ReadableStream({
		start(controller) {
			const send = (data: string) => {
				try {
					controller.enqueue(encoder.encode(data));
				} catch {
					cleanup();
				}
			};

			send(`: connected\n\n`);

			unsubscribe = subscribe(boardId, (event) => {
				send(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
			});

			keepalive = setInterval(() => send(`: ping\n\n`), KEEPALIVE_MS);

			const onAbort = () => cleanup();
			request.signal.addEventListener('abort', onAbort);

			function cleanup() {
				if (unsubscribe) {
					unsubscribe();
					unsubscribe = null;
				}
				if (keepalive) {
					clearInterval(keepalive);
					keepalive = null;
				}
				try {
					controller.close();
				} catch {
					// already closed
				}
			}
		},
		cancel() {
			if (unsubscribe) unsubscribe();
			if (keepalive) clearInterval(keepalive);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
