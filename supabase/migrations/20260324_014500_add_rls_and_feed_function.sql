-- RLS policies and helper feed function.

alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.flags enable row level security;

-- USERS
drop policy if exists users_select_self on public.users;
create policy users_select_self
on public.users
for select
to authenticated
using (id = auth.uid());

drop policy if exists users_insert_self on public.users;
create policy users_insert_self
on public.users
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists users_update_self on public.users;
create policy users_update_self
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- POSTS
drop policy if exists posts_select_active on public.posts;
create policy posts_select_active
on public.posts
for select
to authenticated
using (
  is_deleted = false
  and expires_at > now()
);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
on public.posts
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own
on public.posts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own
on public.posts
for delete
to authenticated
using (user_id = auth.uid());

-- COMMENTS
drop policy if exists comments_select_active on public.comments;
create policy comments_select_active
on public.comments
for select
to authenticated
using (
  is_deleted = false
  and exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and p.is_deleted = false
      and p.expires_at > now()
  )
);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own
on public.comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and p.is_deleted = false
      and p.expires_at > now()
  )
);

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own
on public.comments
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own
on public.comments
for delete
to authenticated
using (user_id = auth.uid());

-- REACTIONS
drop policy if exists reactions_select_on_visible_content on public.reactions;
create policy reactions_select_on_visible_content
on public.reactions
for select
to authenticated
using (
  (
    post_id is not null
    and exists (
      select 1
      from public.posts p
      where p.id = reactions.post_id
        and p.is_deleted = false
        and p.expires_at > now()
    )
  )
  or
  (
    comment_id is not null
    and exists (
      select 1
      from public.comments c
      join public.posts p on p.id = c.post_id
      where c.id = reactions.comment_id
        and c.is_deleted = false
        and p.is_deleted = false
        and p.expires_at > now()
    )
  )
);

drop policy if exists reactions_insert_own on public.reactions;
create policy reactions_insert_own
on public.reactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    (
      post_id is not null
      and comment_id is null
      and exists (
        select 1
        from public.posts p
        where p.id = reactions.post_id
          and p.is_deleted = false
          and p.expires_at > now()
      )
    )
    or
    (
      post_id is null
      and comment_id is not null
      and exists (
        select 1
        from public.comments c
        join public.posts p on p.id = c.post_id
        where c.id = reactions.comment_id
          and c.is_deleted = false
          and p.is_deleted = false
          and p.expires_at > now()
      )
    )
  )
);

drop policy if exists reactions_delete_own on public.reactions;
create policy reactions_delete_own
on public.reactions
for delete
to authenticated
using (user_id = auth.uid());

-- FLAGS
drop policy if exists flags_select_own on public.flags;
create policy flags_select_own
on public.flags
for select
to authenticated
using (reporter_user_id = auth.uid());

drop policy if exists flags_insert_own on public.flags;
create policy flags_insert_own
on public.flags
for insert
to authenticated
with check (
  reporter_user_id = auth.uid()
  and (
    (
      target_post_id is not null
      and target_comment_id is null
      and exists (
        select 1
        from public.posts p
        where p.id = flags.target_post_id
      )
    )
    or
    (
      target_post_id is null
      and target_comment_id is not null
      and exists (
        select 1
        from public.comments c
        where c.id = flags.target_comment_id
      )
    )
  )
);

-- Helper function: local feed within 5 km, excluding expired/deleted posts.
create or replace function public.get_local_feed_posts(
  p_latitude double precision,
  p_longitude double precision,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  user_id uuid,
  content text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz,
  expires_at timestamptz,
  distance_meters double precision
)
language sql
stable
security invoker
as $$
  select
    p.id,
    p.user_id,
    p.content,
    p.latitude,
    p.longitude,
    p.created_at,
    p.expires_at,
    st_distance(
      p.location,
      st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography
    ) as distance_meters
  from public.posts p
  where p.is_deleted = false
    and p.expires_at > now()
    and st_dwithin(
      p.location,
      st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography,
      5000
    )
  order by p.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.get_local_feed_posts(double precision, double precision, integer, integer) to authenticated;
