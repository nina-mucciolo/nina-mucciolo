-- Dollars to Yum Yums — initial schema.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.

-- ───────────────────────── profiles ─────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 40),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any signed-in user can look up profiles (needed to find friends by username).
create policy "profiles readable by signed-in users"
  on public.profiles for select to authenticated using (true);

create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Create an empty profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── places (shared cache) ─────────────────────────
-- One row per Google place ID, written only by the server (service role) the
-- first time anyone adds that restaurant. Friends match on place_id.
create table if not exists public.places (
  place_id text primary key,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  photo_path text,               -- path inside the "place-photos" storage bucket
  photo_attribution text,        -- Google requires showing the photo author
  photo_attribution_uri text,
  created_at timestamptz not null default now()
);

alter table public.places enable row level security;

create policy "places readable by signed-in users"
  on public.places for select to authenticated using (true);
-- No insert/update policy: only the service role (server) writes here.

-- ───────────────────────── friendships ─────────────────────────
create table if not exists public.friendships (
  requester uuid not null references public.profiles (id) on delete cascade,
  addressee uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);

-- Prevent A→B and B→A from both existing.
create unique index if not exists friendships_pair_unique
  on public.friendships (least(requester, addressee), greatest(requester, addressee));

alter table public.friendships enable row level security;

create policy "see own friendships"
  on public.friendships for select to authenticated
  using (auth.uid() in (requester, addressee));

create policy "send friend requests"
  on public.friendships for insert to authenticated
  with check (requester = auth.uid() and status = 'pending');

create policy "addressee accepts"
  on public.friendships for update to authenticated
  using (addressee = auth.uid()) with check (addressee = auth.uid() and status = 'accepted');

create policy "either side removes"
  on public.friendships for delete to authenticated
  using (auth.uid() in (requester, addressee));

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = a and f.addressee = b) or (f.requester = b and f.addressee = a))
  );
$$;

-- ───────────────────────── ratings ─────────────────────────
create table if not exists public.ratings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id text not null references public.places (place_id) on delete cascade,
  yum numeric(3,1) not null check (yum between 0 and 10),
  dollars numeric(3,1) not null check (dollars between 0 and 10),
  note text check (char_length(note) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create index if not exists ratings_place_idx on public.ratings (place_id);

alter table public.ratings enable row level security;

create policy "read own and friends' ratings"
  on public.ratings for select to authenticated
  using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));

create policy "insert own ratings"
  on public.ratings for insert to authenticated with check (user_id = auth.uid());

create policy "update own ratings"
  on public.ratings for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "delete own ratings"
  on public.ratings for delete to authenticated using (user_id = auth.uid());

-- ───────────────────────── photo storage ─────────────────────────
-- Public bucket: anyone with the URL can view a photo; only the server uploads.
insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', true)
on conflict (id) do nothing;
