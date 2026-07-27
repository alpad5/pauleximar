-- pauleximar: notes block kind
-- One free-text note body per notes-kind block. Run via `npm run migrate`.

create table if not exists notes (
  block_id    uuid primary key references blocks(id) on delete cascade,
  body        text not null default '',
  updated_at  timestamptz not null default now()
);
