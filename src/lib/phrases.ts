// Spanish micro-copy for block placeholders / empty states. Picked per-block via
// a seed (the block id) so each block gets its own phrase that stays stable across
// SSR + hydration — "random" in feel, deterministic in fact.

export const TODO_PLACEHOLDERS = [
	'añade algo…',
	'¿qué falta?',
	'apunta una tarea…',
	'una cosa más…',
	'escribe algo por hacer…',
	'lo siguiente…'
];

export const TODO_EMPTY = [
	'nada por ahora',
	'todo hecho ✨',
	'vacío… de momento',
	'aún no hay nada',
	'ni una tarea todavía'
];

export const NOTE_PLACEHOLDERS = [
	'escribe lo que quieras…',
	'anota algo…',
	'lo que se te ocurra…',
	'tus ideas aquí…',
	'empieza a escribir…'
];

// Small stable string hash → index. Same seed always yields the same phrase.
export function pickFrom<T>(list: T[], seed: string): T {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
	return list[Math.abs(h) % list.length];
}
