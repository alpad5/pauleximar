#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'migrations');

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set. Source your .env first or pass it inline.');
	process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });

try {
	const files = readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql'))
		.sort();

	for (const file of files) {
		const path = join(migrationsDir, file);
		const body = readFileSync(path, 'utf8');
		process.stdout.write(`→ ${file} ... `);
		await sql.unsafe(body);
		process.stdout.write('ok\n');
	}

	console.log('migrations complete');
} finally {
	await sql.end({ timeout: 5 });
}
