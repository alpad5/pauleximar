-- pauleximar: per-task priority + due date
-- Run via `npm run migrate` (idempotent).

alter table todos add column if not exists priority text;
alter table todos add column if not exists due_date date;

-- Allow null (no priority) or one of the three levels.
alter table todos drop constraint if exists todos_priority_chk;
alter table todos add constraint todos_priority_chk
  check (priority is null or priority in ('alta', 'media', 'baja'));
