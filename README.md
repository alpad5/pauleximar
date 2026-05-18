# pauleximar

A tiny shared board for two. Color-coded blocks, no accounts — anyone with the URL is in.

Stack: SvelteKit + TypeScript, Postgres (Railway), Server-Sent Events for live sync.

## Local development

```sh
npm install
cp .env.example .env
# paste your Railway Postgres DATABASE_URL into .env
npm run dev
```

Visit `http://localhost:5173`, click "Create a new board", you'll land on `/b/<uuid>`. That URL is what you share.

## Database setup

1. In your Railway project, click **New → Database → Add PostgreSQL**.
2. Open the new service, go to **Variables**, copy `DATABASE_PUBLIC_URL` (for local dev) or `DATABASE_URL` (for the deployed app).
3. Paste it into your `.env` for local dev.
4. Run the initial migration once against the database:

   ```sh
   psql "$DATABASE_URL" -f migrations/001_init.sql
   ```

   Or paste the SQL into Railway's Postgres "Data" tab.

## Deploying to Railway

1. Push this repo to GitHub.
2. In Railway: **New → Deploy from GitHub** and pick the repo.
3. Add the Postgres service to the same project (see above).
4. In the SvelteKit service's **Variables**, add `DATABASE_URL` referencing the Postgres service (Railway autocompletes `${{Postgres.DATABASE_URL}}`).
5. Deploy. Railway uses nixpacks by default (`railway.json` specifies `node build` as the start command). To use the included Dockerfile instead, switch the builder in Railway's settings.

## Adding more block kinds

The data model already supports `'notes' | 'grocery' | 'messages'` as `blocks.kind` values. To add one:

1. Add a new component in `src/lib/components/` (e.g. `NotesBlock.svelte`).
2. Wire it into the `{#each blocks}` switch in `src/routes/b/[id]/+page.svelte`.
3. Add API endpoints under `src/routes/b/[id]/api/` mirroring the todos pattern.
4. Decide how new blocks get created — for now they don't (the default board ships with one Todos block).

## Architecture notes

- **Auth = secret URL.** RLS-equivalent enforcement happens at the query layer: every mutation scopes by `board_id` from the URL. Anyone with the link has full read/write access. That's the design.
- **Realtime is in-memory pub/sub on the server.** Single instance only. To scale horizontally you'd swap `src/lib/server/realtime.ts` for Postgres `LISTEN/NOTIFY` or Redis pub/sub.
- **No ORM.** `postgres` (postgres.js) tagged templates handle SQL injection safely; queries live in `src/lib/server/repo.ts`.
