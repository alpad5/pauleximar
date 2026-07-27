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
