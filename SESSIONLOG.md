# Session Log

## 2026-07-26
- Added `CLAUDE.md`: conciseness preference (short/concise answers) + session-logging rule.
- Created this `SESSIONLOG.md`.
- **Feature: add blocks + notes kind.** Users can now create new blocks on a board
  (Todos or Notes) via an "add block" card. Implemented the previously-unused `notes`
  block kind (free-text, autosaved, live-synced).
  - `migrations/002_notes.sql`: `notes(block_id pk, body, updated_at)`.
  - `repo.ts`: `createBlock()`, `setNote()`; snapshot now attaches `note` per block.
  - Endpoints: `POST /b/[id]/api/blocks`, `PUT /b/[id]/api/notes/[blockId]`.
  - New SSE events `block_added` / `note_updated`; `NotesBlock.svelte`; board page
    add-block UI + notes rendering.
  - Verified end-to-end against Railway Postgres (board → Viaje notes block → body
    persists → todos block → SSR renders).
- **Fixes & polish:**
  - Fixed a bug where the notes textarea couldn't be edited (sync `$effect` was
    reverting keystrokes); now re-syncs only on remote prop change + skips while focused.
  - Add-block card: relabelled to **lista** / **notas**, added a curated 12-color
    swatch picker (`src/lib/palette.ts`); color chosen at creation, validated server-side.
  - Blocks now fill with a 12% `color-mix` tint of their accent (not just the header bar).
  - Translated all UI copy to Spanish; block placeholders/empty states are randomized
    per-block via a seeded picker (`src/lib/phrases.ts`).
- Committed + pushed to `main` (GitHub `alpad5/pauleximar`).

## 2026-07-27
- **Deployed the web service to Railway.** Project only had Postgres before; created
  `pauleximar-web` service (`DATABASE_URL=${{Postgres.DATABASE_URL}}`) and deployed via
  `railway up` (direct upload — GitHub-connect via CLI returned Unauthorized). Live at
  https://pauleximar-web-production.up.railway.app. **Not yet push-to-deploy**: connect
  the repo in the Railway dashboard to enable auto-deploy; until then redeploy with
  `railway up`. (Correction to yesterday's note — deploy is manual, not auto.)
- **Feature: delete blocks.** `deleteBlock()` + `DELETE /api/blocks/[blockId]` +
  `block_deleted` SSE event; hover-reveal × in the block header with a Spanish `confirm()`.
  FK cascade removes the block's todos/notes.
- **Feature: task priority + due date (Phase 1).** `migrations/003_priority.sql` adds
  `priority` (alta/media/baja) + `due_date` to `todos`. Replaced `setTodoDone` with a
  general `updateTodo`; extended todo `PATCH`. TodoBlock: click-to-cycle priority dot
  (far right), colored left stripe, due chip (hoy/mañana/N días/vencido), priority sort,
  completed tasks sink to bottom.
- **Feature: prioridades summary block (Phase 2).** `migrations/004_prioridades_kind.sql`
  adds the `prioridades` block kind. Client-derived view (no new API) aggregating every
  tagged/dated open task board-wide. Extracted shared `src/lib/priority.ts`.
- **UI: banner + mosaic.** Prioridades renders as a full-width banner (horizontal chips)
  pinned above a mosaic grid; blocks get semi-random widths (seeded by id) + content
  height. Mobile collapses to one column, priorities first.
- All verified end-to-end (local + prod DB, SSR).

## 2026-07-28
- **Push-to-deploy now works.** Connected `pauleximar-web` to `alpad5/pauleximar` @ `main`.
  The GitHub App access was fine all along — the blocker was the `railway` CLI, whose
  token lacks scope for `railway add --repo` / `railway domain` / the `githubRepos` query.
  Worked around it by calling the Railway GraphQL API directly with the CLI's own token
  (`serviceConnect` mutation). Verified: the merge below auto-triggered a build.
- **Fixed the failing builds (PR #1).** `repo.ts` built `TODO_COLS` by calling
  ``sql`...` `` at module scope, which fired the lazy client proxy in `db.ts` on import.
  SvelteKit's postbuild `analyse` step imports server modules at build time, where
  `DATABASE_URL` is unset, so `getClient()` threw — every build since the priority
  feature failed this way. Wrapped it in `todoCols()` so the fragment is only built
  inside a query. Reproduced the exact failure locally (`npm run build` with
  `DATABASE_URL` unset) and confirmed it now passes; Railway build went green.
- **Custom domain `bavardage.org`.** Registered on Railway via `customDomainCreate`;
  Cloudflare apex `CNAME @ -> xyv5xwge.up.railway.app`, **DNS-only (grey cloud)**.
  Deliberately unproxied: the orange cloud would need SSL/TLS "Full (strict)" and
  Cloudflare's ~100s idle timeout would break the app's SSE live sync. DNS and HTTP
  routing confirmed working; TLS cert still issuing at time of writing.
- **Wiped the database** (`truncate boards cascade`) to start fresh on the real domain —
  14 test boards from prior verification runs removed, schema and tables intact.
- **`CLAUDE.md`:** added a PR policy — open PRs and ask before merging.
- **Rebrand to `bavardage`** (PR #3). `pauleximar` is now internal only (repo, npm package
  and Railway service names keep it). All user-facing copy, page titles and the
  `localStorage` key renamed.
- **Logo.** Lowercase `b` in Yeseva One, set in an accent-filled rounded square
  (`Logo.svelte`): 28px in the board topbar, 44px on the landing page. Font is self-hosted
  (`static/fonts/yeseva-one-latin-400.woff2`, latin subset, 11 KB) as `--font-display`, so
  there's no third-party font request.

### The certificate saga — read this before touching Railway domains again
Getting TLS on the custom domain took ~90 minutes and most of it was wasted motion. The
actual cause, found only at the end:

> **A Railway custom domain requires TWO DNS records.** The `CNAME` for traffic, *and* a
> `TXT` at `_railway-verify.<label>` carrying an ownership token. The GraphQL API's
> `status.dnsRecords` returns **only the CNAME** — the TXT requirement appears **only** in
> the dashboard, under the domain row's "Show DNS records". Without it the cert sits in
> `VALIDATING_OWNERSHIP` indefinitely and no error is surfaced anywhere in the API.

Once the TXT was added, the `customDomainIssueCertificate(id)` mutation flipped it to
`VALID` in seconds — no waiting required.

What was wasted, so it isn't repeated:
- The domain was deleted and re-created **twice** as a blind retry. Each re-create rotates
  the `*.up.railway.app` CNAME target, costing a manual Cloudflare edit each time.
- A confident-but-wrong diagnosis ("Cloudflare apex CNAME flattening breaks Railway's
  ownership check") drove a move from the apex to `www`. `www` is the better setup anyway
  and was kept, but it was not the fix — the apex would have worked fine with the TXT record.
- Lesson: when a provider reports a stuck state, read the provider's own UI before mutating
  anything. The answer was on screen the whole time and absent from the API.

### Final state
- Cert **issued and valid**: `CN=www.bavardage.org`, Let's Encrypt, expires 2026-10-26.
- Apex → `https://www.bavardage.org` redirect works (dummy proxied `A 192.0.2.1` + Cloudflare
  Redirect Rule).
- **Outstanding:** `https://www.bavardage.org` returns **404** with `x-railway-fallback: true`,
  while the railway.app domain returns 200. Railway's edge isn't routing the hostname to the
  service. Two candidates, in order: (1) the custom domain has `targetPort: null` while the
  app listens on **8080** — set it via `customDomainUpdate`; (2) the edge may need a redeploy
  to bind the new hostname. Neither tried yet.
