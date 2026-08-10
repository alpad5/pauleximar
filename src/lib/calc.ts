import type { Payer } from './types';

// Click the swatch to cycle who paid. Distinct hues from the priority colors
// (red/orange/blue) so the two systems never look related.
export const PAYER_CYCLE: (Payer | null)[] = [null, 'a', 'b'];

const COLOR: Record<Payer, string> = { a: '#8a6fb0', b: '#4f9e6c' };
const LABEL: Record<Payer, string> = { a: 'morado', b: 'verde' };

export function payerColor(p: Payer | null): string {
	return p ? COLOR[p] : 'transparent';
}
export function payerTitle(p: Payer | null): string {
	return p ? `Pagado por ${LABEL[p]}` : 'Sin asignar — clic para elegir color';
}
export function payerLabel(p: Payer): string {
	return LABEL[p];
}

export function formatMoney(amount: number): string {
	return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

export type Settlement = { totalA: number; totalB: number; owes: Payer | null; amount: number };

// Whoever paid less owes the other half the difference.
export function settle(items: { amount: number; payer: Payer | null }[]): Settlement {
	let totalA = 0;
	let totalB = 0;
	for (const i of items) {
		if (i.payer === 'a') totalA += i.amount;
		else if (i.payer === 'b') totalB += i.amount;
	}
	const diff = totalA - totalB;
	const amount = Math.round((Math.abs(diff) / 2) * 100) / 100;
	const owes = amount === 0 ? null : diff > 0 ? 'b' : 'a';
	return { totalA, totalB, owes, amount };
}
