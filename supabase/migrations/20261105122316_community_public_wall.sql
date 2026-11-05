begin;
create table public.pblm_community_posts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 nickname text not null check(char_length(btrim(nickname)) between 2 and 40),
 title text not null check(char_length(btrim(title)) between 3 and 120),
 body text not null check(char_length(btrim(body)) between 1 and 3000),
 category text not null check(category in ('conversa','projetos','duvidas')),
 created_at timestamptz not null default now()
);
alter table public.pblm_community_posts enable row level security;
alter table public.pblm_community_posts force row level security;
revoke all on public.pblm_community_posts from public,anon,authenticated;
grant select on public.pblm_community_posts to anon,authenticated;
grant insert(nickname,title,body,category),update(nickname,title,body,category),delete on public.pblm_community_posts to authenticated;
create policy community_read on public.pblm_community_posts for select to anon,authenticated using(true);
create policy community_create on public.pblm_community_posts for insert to authenticated with check(owner_id=(select auth.uid()));
create policy community_edit on public.pblm_community_posts for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy community_delete on public.pblm_community_posts for delete to authenticated using(owner_id=(select auth.uid()));
create index community_newest on public.pblm_community_posts(created_at desc,id desc);
create index community_owner on public.pblm_community_posts(owner_id);
create function public.pblm_community_limit() returns trigger language plpgsql set search_path=pg_catalog as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text,777));
 if exists(select 1 from public.pblm_community_posts where owner_id=new.owner_id and created_at>now()-interval '60 seconds') then raise exception 'Aguarde 60 segundos entre publicações.'; end if;
 if (select count(*) from public.pblm_community_posts where owner_id=new.owner_id)>=100 then raise exception 'Limite de 100 publicações por conta atingido.'; end if;
 return new;
end $$;
revoke all on function public.pblm_community_limit() from public,anon,authenticated;
create trigger community_limit before insert on public.pblm_community_posts for each row execute function public.pblm_community_limit();
comment on table public.pblm_community_posts is 'Mural público. Apelidos autodeclarados não comprovam cargo ou identidade. Notas pessoais permanecem em tabela separada.';
commit;
