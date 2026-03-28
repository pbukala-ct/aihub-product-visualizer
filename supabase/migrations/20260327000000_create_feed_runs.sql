create table if not exists feed_runs (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  type text not null check (type in ('full', 'delta', 'unknown')),
  product_count integer not null default 0,
  raw_payload text,
  created_at timestamptz not null default now()
);

alter table feed_runs enable row level security;

-- Allow SELECT for anonymous and authenticated users; no client-side writes
create policy "feed_runs_select_all" on feed_runs
  for select to anon, authenticated using (true);
