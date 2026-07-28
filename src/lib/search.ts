// Board search. The whole board already lives in memory on the client, so this
// is just a few string helpers — no index, no query endpoint, no round-trip.
//
// Every function here takes an *already folded* query (see `fold`); callers fold
// the user's input once instead of on every comparison.

/**
 * Lowercase and strip accents, preserving length 1:1 with the input so match
 * indices map straight back onto the original text ("límite" ~ "limite").
 */
export function fold(s: string): string {
	let out = '';
	for (let i = 0; i < s.length; i++) {
		const c = s[i].normalize('NFD').toLowerCase();
		out += c.length === 1 ? c : c[0];
	}
	return out;
}

export function hits(text: string | null | undefined, query: string): boolean {
	return !!text && fold(text).includes(query);
}

export type Segment = { text: string; hit: boolean };

/** Split `text` into alternating plain/matching runs, for <mark> rendering. */
export function segments(text: string, query: string): Segment[] {
	if (!query) return [{ text, hit: false }];
	const hay = fold(text);
	const out: Segment[] = [];
	let at = 0;
	for (;;) {
		const i = hay.indexOf(query, at);
		if (i < 0) break;
		if (i > at) out.push({ text: text.slice(at, i), hit: false });
		out.push({ text: text.slice(i, i + query.length), hit: true });
		at = i + query.length;
	}
	if (!out.length) return [{ text, hit: false }];
	if (at < text.length) out.push({ text: text.slice(at), hit: false });
	return out;
}

/** A window of `body` around the first match, with ellipses where trimmed. */
export function excerpt(body: string, query: string, radius = 90): string {
	const i = fold(body).indexOf(query);
	if (i < 0) return body.slice(0, radius * 2);
	const start = Math.max(0, i - radius);
	const end = Math.min(body.length, i + query.length + radius);
	return (start > 0 ? '…' : '') + body.slice(start, end).trim() + (end < body.length ? '…' : '');
}
