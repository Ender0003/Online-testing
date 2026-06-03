create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  author_name text not null default '',
  author_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tests_author_email_idx on public.tests (author_email);
create index if not exists tests_created_at_idx on public.tests (created_at desc);

alter table public.tests enable row level security;

drop policy if exists "Anyone can read tests" on public.tests;
create policy "Anyone can read tests"
on public.tests
for select
using (true);

drop policy if exists "Anyone can create tests" on public.tests;
create policy "Anyone can create tests"
on public.tests
for insert
with check (true);

drop policy if exists "Anyone can update tests" on public.tests;
create policy "Anyone can update tests"
on public.tests
for update
using (true)
with check (true);

drop policy if exists "Anyone can delete tests" on public.tests;
create policy "Anyone can delete tests"
on public.tests
for delete
using (true);
