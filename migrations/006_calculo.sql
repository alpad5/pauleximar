-- pauleximar: 'calculo' (shared expenses) and 'resultados' (settle-up) block kinds
-- Run via `npm run migrate` (idempotent).

alter table blocks drop constraint if exists blocks_kind_check;
alter table blocks add constraint blocks_kind_check
  check (kind in ('todos', 'notes', 'grocery', 'messages', 'prioridades', 'calculo', 'resultados'));

create table if not exists calc_items (
  id          uuid primary key default gen_random_uuid(),
  block_id    uuid not null references blocks(id) on delete cascade,
  text        text not null,
  amount      numeric(10,2) not null default 0,
  payer       text check (payer in ('a', 'b')),
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists calc_items_block_idx on calc_items (block_id, position, created_at);
