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
- **Board-wide search** (PR #5). Searches block titles, task text and note bodies from the
  topbar. Because the whole board is already in memory on the client (`blocks` state, kept
  fresh by SSE), this needed **no endpoint, no index and no dependency** — it's a filter over
  existing state. `src/lib/search.ts` (50 lines) + `Mark.svelte` (25); bundle grew ~1 kB.
  Matching blocks stay lit while the rest fade and desaturate, so the mosaic never reflows.
  Two decisions worth remembering: `fold()` strips diacritics **while preserving string
  length 1:1**, so `limite` matches `límite` *and* highlight offsets still map onto the
  original accented text; and notes go read-only during a search, because highlighting
  inside a live `<textarea>` needs an overlay hack that costs more than the feature.

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

## 2026-08-05
- **Feature: drag-to-reorder and width toggle for grid blocks** (PR #8). Picked up
  unfinished work from a prior session — server side (migration, `repo.ts`, SSE events,
  API routes) and `Block.svelte`'s grip/toggle UI already existed uncommitted; missing
  piece was wiring drag state and the new SSE events into `+page.svelte`.
  - `migrations/005_block_span.sql`: nullable `blocks.span` (1 or 2; null = mosaic default).
  - Drag: pointerdown on a grip captures the pointer; the dragged block rides the pointer
    via `translate` while its grid slot stays put as the drop preview (`pointer-events: none`
    so `elementFromPoint` hits the block underneath). Drop reorders via "insert before
    target". Arrow keys on the focused grip nudge by one position — the keyboard fallback.
  - New SSE events `blocks_reordered` / `block_resized` sync both actions live.
  - Migration run against the live Railway Postgres (additive, idempotent).
  - Verified manually in the browser (chromium-cli / Playwright weren't installed, and
    installing Playwright + a Chromium binary for a one-off check wasn't worth it).
- **Landing page copy** (PR #9): dropped "para dos" / "tu pareja" from the subtitle and
  hint text — same pitch, without assuming who the board is shared with. Authored directly
  on GitHub's web editor, not through this session; just opened + merged the PR for it.

## 2026-08-10
- **Feature: `calculo` (shared expenses) and `resultados` (settle-up) block kinds.**
  Asked first whether the two payers needed names — user chose color-only identity, no
  person names anywhere, so the whole feature stays color-keyed (no naming/accounts system).
  - `migrations/006_calculo.sql`: `calc_items(id, block_id, text, amount numeric(10,2),
    payer 'a'|'b' nullable, position, created_at)`; extends `blocks_kind_check`.
  - `src/lib/calc.ts`: payer color/cycle (purple `#8a6fb0` / green `#4f9e6c`, distinct from
    the priority reds/oranges/blues), `formatMoney` (es-ES/EUR), `settle()` — whoever paid
    less owes half the difference.
  - `repo.ts`: `addCalcItem` / `updateCalcItem` / `deleteCalcItem`; snapshot now attaches
    `calc_items` per block (amount cast to `float8` so postgres.js returns a number, not a
    numeric string).
  - Endpoints: `POST /b/[id]/api/calc`, `PATCH`/`DELETE /b/[id]/api/calc/[itemId]`.
  - New SSE events `calc_item_added/updated/deleted`.
  - `CalcBlock.svelte` (item list: text, amount, payer-color cycle dot, like the priority
    dot) and `ResultsBlock.svelte` (renders as a full-width banner like `prioridades`;
    board-wide totals per color + settle-up sentence, aggregated across all `calculo`
    blocks the same way the priorities banner aggregates todos).
  - `svelte-check` (0 errors) and `npm run build` both clean.
  - **Not yet run:** `npm run migrate` against the live Railway Postgres — this sandbox's
    network lets a TCP handshake through to `centerbeam.proxy.rlwy.net:20338` but drops the
    actual data (connect succeeds, first write/read times out), so the Postgres wire
    protocol never completes. Confirmed with a raw-socket test, not sandbox-specific (same
    result with the sandbox disabled). Someone needs to run `npm run migrate` from a
    machine that can actually reach Railway before this feature works on the real board.
