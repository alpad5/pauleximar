-- pauleximar: add the 'prioridades' summary block kind
-- Run via `npm run migrate` (idempotent).

alter table blocks drop constraint if exists blocks_kind_check;
alter table blocks add constraint blocks_kind_check
  check (kind in ('todos', 'notes', 'grocery', 'messages', 'prioridades'));
