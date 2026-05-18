import postgres from 'postgres';
import { env } from '$env/dynamic/private';

type Sql = ReturnType<typeof postgres>;

let client: Sql | null = null;

function getClient(): Sql {
	if (client) return client;
	if (!env.DATABASE_URL) {
		throw new Error(
			'DATABASE_URL is not set. Copy .env.example to .env and paste your Railway Postgres URL.'
		);
	}
	client = postgres(env.DATABASE_URL, {
		max: 5,
		idle_timeout: 20,
		prepare: false
	});
	return client;
}

// Proxy so `sql\`select 1\`` and `sql(value)` (postgres.js helpers) both lazily
// initialize the connection on first use — keeps the SvelteKit build analyser
// from tripping when DATABASE_URL is absent at build time.
export const sql: Sql = new Proxy(function () {} as unknown as Sql, {
	apply(_target, thisArg, args) {
		const c = getClient() as unknown as (...a: unknown[]) => unknown;
		return Reflect.apply(c, thisArg, args);
	},
	get(_target, prop, receiver) {
		return Reflect.get(getClient(), prop, receiver);
	}
}) as Sql;
