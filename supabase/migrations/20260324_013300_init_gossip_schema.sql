-- Initial schema for the India-focused anonymous gossip app.
-- Core tables: users, posts, comments, reactions, flags.

create extension if not exists pgcrypto;
create extension if not exists postgis;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  device_uuid text not null unique,
  username text,
  age_band text check (age_band in ('18-21', '22-25', '26-30', '31-35', 'unknown')) default 'unknown',
  campus_name text,
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  latitude double precision not null,
  longitude double precision not null,
  location geography(point, 4326) generated always as (
    st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
  ) stored,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_latitude_valid check (latitude between -90 and 90),
  constraint posts_longitude_valid check (longitude between -180 and 180)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reaction_type text not null default 'like',
  created_at timestamptz not null default now(),
  constraint reactions_target_check check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);

create unique index if not exists reactions_unique_post_reaction
  on public.reactions (user_id, post_id, reaction_type)
  where post_id is not null;

create unique index if not exists reactions_unique_comment_reaction
  on public.reactions (user_id, comment_id, reaction_type)
  where comment_id is not null;

create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.users(id) on delete cascade,
  target_post_id uuid references public.posts(id) on delete cascade,
  target_comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (
    reason in (
      'defamation',
      'religious_targeting',
      'caste_content',
      'threat',
      'personal_info',
      'other'
    )
  ),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint flags_target_check check (
    (target_post_id is not null and target_comment_id is null) or
    (target_post_id is null and target_comment_id is not null)
  )
);

create index if not exists posts_location_gix on public.posts using gist (location);
create index if not exists posts_expires_at_idx on public.posts (expires_at);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_created_at_idx on public.comments (created_at desc);
create index if not exists flags_status_idx on public.flags (status);
create index if not exists flags_reason_idx on public.flags (reason);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
before update on public.posts
for each row execute function public.touch_updated_at();

drop trigger if exists comments_touch_updated_at on public.comments;
create trigger comments_touch_updated_at
before update on public.comments
for each row execute function public.touch_updated_at();
