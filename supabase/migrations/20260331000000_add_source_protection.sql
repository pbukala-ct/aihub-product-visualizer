alter table sources
  add column if not exists is_protected boolean not null default false,
  add column if not exists access_password_hash text;

-- Drop the blanket anon SELECT policy so unprotected access via anon key
-- requires is_protected = false. Service-role client bypasses RLS entirely.
drop policy if exists "sources_select_all" on sources;

create policy "sources_select_public" on sources
  for select to anon using (is_protected = false);

create policy "sources_select_authenticated" on sources
  for select to authenticated using (true);
