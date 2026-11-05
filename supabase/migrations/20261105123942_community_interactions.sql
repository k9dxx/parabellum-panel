create table public.pblm_community_comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.pblm_community_posts(id) on delete cascade,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 nickname text not null check(char_length(trim(nickname)) between 2 and 40),
 body text not null check(char_length(trim(body)) between 1 and 1000),
 created_at timestamptz not null default now()
);
create index pblm_comments_post on public.pblm_community_comments(post_id,created_at desc,id desc);
create index pblm_comments_owner on public.pblm_community_comments(owner_id);
alter table public.pblm_community_comments enable row level security;
alter table public.pblm_community_comments force row level security;
revoke all on public.pblm_community_comments from public,anon,authenticated;
grant select on public.pblm_community_comments to anon,authenticated;
grant insert(post_id,nickname,body),delete on public.pblm_community_comments to authenticated;
create policy comments_read on public.pblm_community_comments for select to anon,authenticated using(true);
create policy comments_insert on public.pblm_community_comments for insert to authenticated with check(owner_id=(select auth.uid()));
create policy comments_delete on public.pblm_community_comments for delete to authenticated using(owner_id=(select auth.uid()));
create function public.pblm_comment_limit() returns trigger language plpgsql set search_path=pg_catalog as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text,778));
 if exists(select 1 from public.pblm_community_comments where owner_id=new.owner_id and created_at>now()-interval '15 seconds') then raise exception 'Aguarde 15 segundos entre comentários.'; end if;
 if (select count(*) from public.pblm_community_comments where owner_id=new.owner_id)>=500 then raise exception 'Limite de 500 comentários por conta.'; end if;
 return new;
end $$;
revoke all on function public.pblm_comment_limit() from public,anon,authenticated;
create trigger pblm_comment_limit before insert on public.pblm_community_comments for each row execute function public.pblm_comment_limit();
create table public.pblm_community_likes (
 post_id uuid not null references public.pblm_community_posts(id) on delete cascade,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 primary key(post_id,owner_id)
);
create index pblm_likes_owner on public.pblm_community_likes(owner_id);
alter table public.pblm_community_likes enable row level security;
alter table public.pblm_community_likes force row level security;
revoke all on public.pblm_community_likes from public,anon,authenticated;
-- Visitors may count reactions but cannot read account identifiers.
grant select(post_id) on public.pblm_community_likes to anon;
grant select,delete on public.pblm_community_likes to authenticated;
grant insert(post_id) on public.pblm_community_likes to authenticated;
create policy likes_read on public.pblm_community_likes for select to anon,authenticated using(true);
create policy likes_insert on public.pblm_community_likes for insert to authenticated with check(owner_id=(select auth.uid()));
create policy likes_delete on public.pblm_community_likes for delete to authenticated using(owner_id=(select auth.uid()));
create view public.pblm_community_like_counts with (security_invoker=true) as select post_id,count(post_id) as total from public.pblm_community_likes group by post_id;
grant select on public.pblm_community_like_counts to anon,authenticated;
