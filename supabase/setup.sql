-- Run once in your project's Supabase SQL Editor. Contains no credentials.
begin;
create table if not exists public.flit_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0,
  data jsonb not null,
  files jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.flit_workspaces enable row level security;
revoke all on public.flit_workspaces from anon, authenticated;
grant select on public.flit_workspaces to authenticated;
drop policy if exists flit_read_own_workspace on public.flit_workspaces;
create policy flit_read_own_workspace on public.flit_workspaces for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.flit_save_workspace(expected_revision bigint, workspace_data jsonb, workspace_files jsonb, expected_user_id uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  current_revision bigint;
  new_revision bigint;
begin
  if owner_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if owner_id is distinct from expected_user_id then raise exception 'ACCOUNT_CHANGED'; end if;
  if expected_revision < 0 or expected_revision is null then raise exception 'INVALID_REVISION'; end if;
  if workspace_data is null or jsonb_typeof(workspace_data) <> 'object'
    or workspace_data->>'version' is distinct from '1'
    or jsonb_typeof(workspace_data->'properties') is distinct from 'array'
    or jsonb_typeof(workspace_data->'payments') is distinct from 'array'
    or octet_length(workspace_data::text) > 5242880
    or workspace_files is null or jsonb_typeof(workspace_files) <> 'array' then
    raise exception 'INVALID_WORKSPACE';
  end if;
  if jsonb_array_length(workspace_files) > 2000 or exists (
    select 1 from jsonb_array_elements(workspace_files) f
    where jsonb_typeof(f) <> 'object' or coalesce(f->>'path', '') !~ ('^' || owner_id::text || '/[a-f0-9-]{36}$')
      or not exists (select 1 from jsonb_array_elements(workspace_data->'properties') p where p->>'id' = f->>'propertyId')
  ) then raise exception 'INVALID_FILES'; end if;
  -- Serialize first writes too: a unique user_id guards simultaneous creation.
  insert into public.flit_workspaces(user_id, revision, data, files)
    values (owner_id, 0, workspace_data, '[]'::jsonb) on conflict (user_id) do nothing;
  select revision into current_revision from public.flit_workspaces where user_id = owner_id for update;
  if current_revision <> expected_revision then raise exception 'WORKSPACE_CONFLICT'; end if;
  update public.flit_workspaces set data = workspace_data, files = workspace_files,
    revision = revision + 1, updated_at = now() where user_id = owner_id returning revision into new_revision;
  return new_revision;
end;
$$;
revoke all on function public.flit_save_workspace(bigint,jsonb,jsonb,uuid) from public, anon;
grant execute on function public.flit_save_workspace(bigint,jsonb,jsonb,uuid) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit)
  values ('flit-private','flit-private',false,20971520)
  on conflict (id) do update set public = false, file_size_limit = 20971520;
drop policy if exists flit_read_own_files on storage.objects;
drop policy if exists flit_upload_own_files on storage.objects;
drop policy if exists flit_delete_own_files on storage.objects;
create policy flit_read_own_files on storage.objects for select to authenticated
  using (bucket_id = 'flit-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy flit_upload_own_files on storage.objects for insert to authenticated
  with check (bucket_id = 'flit-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy flit_delete_own_files on storage.objects for delete to authenticated
  using (bucket_id = 'flit-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
