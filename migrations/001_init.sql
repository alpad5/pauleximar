-- pauleximar initial schema
-- Run this in the Railway Postgres "Data" tab or via `psql $DATABASE_URL -f migrations/001_init.sql`.

create extension if not exists pgcrypto;

create table if not exists boards (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

create table if not exists blocks (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references boards(id) on delete cascade,
  kind        text not null check (kind in ('todos', 'notes', 'grocery', 'messages')),
  title       text not null,
  color       text not null,
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists blocks_board_idx on blocks (board_id, position);

create table if not exists todos (
  id          uuid primary key default gen_random_uuid(),
  block_id    uuid not null references blocks(id) on delete cascade,
  text        text not null,
  done        boolean not null default false,
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists todos_block_idx on todos (block_id, position, created_at);
