create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table sources enable row level security;

create policy "sources_select_all" on sources
  for select to anon, authenticated using (true);
