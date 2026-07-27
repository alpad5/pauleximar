import type { Priority, Todo } from './types';

// Click the dot to cycle through these in order.
export const PRIORITY_CYCLE: (Priority | null)[] = [null, 'baja', 'media', 'alta'];
export const PRIORITY_RANK: Record<Priority, number> = { alta: 3, media: 2, baja: 1 };

const COLOR: Record<Priority, string> = { alta: '#e05a4d', media: '#e0a34e', baja: '#5b8fc9' };
const LABEL: Record<Priority, string> = {
	alta: 'Prioridad alta',
	media: 'Prioridad media',
	baja: 'Prioridad baja'
};

export function priColor(p: Priority | null): string {
	return p ? COLOR[p] : 'transparent';
}
export function priTitle(p: Priority | null): string {
	return p ? LABEL[p] : 'Sin prioridad — clic para priorizar';
}

type Sortable = Pick<Todo, 'priority' | 'due_date' | 'position'>;

// Highest priority first, then earliest due date, then original order.
export function comparePriority(a: Sortable, b: Sortable): number {
	const ra = a.priority ? PRIORITY_RANK[a.priority] : 0;
	const rb = b.priority ? PRIORITY_RANK[b.priority] : 0;
	if (rb !== ra) return rb - ra;
	if (a.due_date && b.due_date) return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
	if (a.due_date) return -1;
	if (b.due_date) return 1;
	return a.position - b.position;
}

// A 'YYYY-MM-DD' due date rendered as a short Spanish chip label + urgency state.
export function dueLabel(d: string): { text: string; state: string } {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const [y, m, day] = d.split('-').map(Number);
	const due = new Date(y, m - 1, day);
	const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
	if (diff < 0) return { text: 'vencido', state: 'overdue' };
	if (diff === 0) return { text: 'hoy', state: 'today' };
	if (diff === 1) return { text: 'mañana', state: 'soon' };
	if (diff < 7) return { text: `${diff} días`, state: 'soon' };
	return { text: due.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), state: 'later' };
}
