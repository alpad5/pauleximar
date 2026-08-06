-- pauleximar: user-controlled block width
-- Run via `npm run migrate` (idempotent).
--
-- Nullable on purpose: null means "no preference", and the UI falls back to the
-- deterministic hash-based mosaic width. Only blocks the user has explicitly
-- widened or narrowed carry a value, so existing boards keep their look.

alter table blocks add column if not exists span int;

alter table blocks drop constraint if exists blocks_span_chk;
alter table blocks add constraint blocks_span_chk
  check (span is null or span in (1, 2));
