alter table feed_runs
  add column if not exists source_id uuid references sources(id) on delete set null;

-- Backfill: create a legacy source and assign all existing runs to it
insert into sources (slug, display_name)
values ('legacy', 'Legacy')
on conflict (slug) do nothing;

update feed_runs
set source_id = (select id from sources where slug = 'legacy')
where source_id is null;
