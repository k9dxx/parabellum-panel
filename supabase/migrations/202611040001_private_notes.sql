begin;

create table public.pblm_private_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null default '' check (char_length(body) <= 20000),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pblm_private_notes enable row level security;
alter table public.pblm_private_notes force row level security;
revoke all on table public.pblm_private_notes from public, anon, authenticated;
grant select, insert, update, delete on table public.pblm_private_notes to authenticated;
create index pblm_private_notes_owner_updated on public.pblm_private_notes(owner_id, updated_at desc);

create policy notes_read_own on public.pblm_private_notes for select to authenticated
using ((select auth.uid()) is not null and owner_id = (select auth.uid()));
create policy notes_insert_own on public.pblm_private_notes for insert to authenticated
with check ((select auth.uid()) is not null and owner_id = (select auth.uid()));
create policy notes_update_own on public.pblm_private_notes for update to authenticated
using ((select auth.uid()) is not null and owner_id = (select auth.uid()))
with check ((select auth.uid()) is not null and owner_id = (select auth.uid()));
create policy notes_delete_own on public.pblm_private_notes for delete to authenticated
using ((select auth.uid()) is not null and owner_id = (select auth.uid()));

create function public.pblm_notes_touch() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  new.owner_id := old.owner_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.pblm_notes_touch() from public, anon, authenticated;
create trigger pblm_notes_touch before update on public.pblm_private_notes
for each row execute function public.pblm_notes_touch();

comment on table public.pblm_private_notes is 'Dados pessoais fora do repositório público. Acesso pelo aplicativo restrito ao proprietário por RLS. Sem criptografia de ponta a ponta.';
commit;
