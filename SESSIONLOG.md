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
- Committed + pushed to `main` (GitHub `alpad5/pauleximar`) → Railway auto-deploy.
