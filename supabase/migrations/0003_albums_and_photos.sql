-- ================================================================
-- Love Story Capture — Albums & Photos Setup
-- Paste this entire file into Supabase → SQL Editor → New Query
-- and press "Run". Safe to re-run (idempotent).
--
-- What this creates:
--   1. `albums` table — one row per project (e.g. "Ankit and Urvi")
--        category, title, location, cover_image_url, description,
--        sort_order, created_at / updated_at
--   2. `album_photos` table — many photos per album
--        album_id FK, image_url, alt, caption, sort_order
--   3. RLS policies mirroring portfolio_items (anon read, service_role all)
--   4. updated_at triggers on both tables
--   5. Seed data: each existing portfolio_item becomes an album with
--        one photo so the /works page keeps showing content the
--        moment this migration runs.
-- ================================================================

-- Ensure the shared trigger function exists (in case you skipped 0002)
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ================================================================
-- 1) albums table
-- ================================================================

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  location text not null,
  cover_image_url text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists albums_sort_order_idx
  on public.albums (sort_order asc, created_at asc);
create index if not exists albums_category_idx
  on public.albums (category);

alter table public.albums enable row level security;

drop policy if exists "public can read albums" on public.albums;
create policy "public can read albums"
  on public.albums
  for select
  to anon, public
  using (true);

drop policy if exists "service role full albums" on public.albums;
create policy "service role full albums"
  on public.albums
  for all
  to service_role
  using (true)
  with check (true);

drop trigger if exists albums_updated_at on public.albums;
create trigger albums_updated_at
before update on public.albums
for each row
execute function public.handle_updated_at();

-- ================================================================
-- 2) album_photos table
-- ================================================================

create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  image_url text not null,
  alt text not null default '',
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists album_photos_album_idx
  on public.album_photos (album_id);
create index if not exists album_photos_sort_idx
  on public.album_photos (album_id, sort_order asc, created_at asc);

alter table public.album_photos enable row level security;

drop policy if exists "public can read album photos" on public.album_photos;
create policy "public can read album photos"
  on public.album_photos
  for select
  to anon, public
  using (true);

drop policy if exists "service role full album photos" on public.album_photos;
create policy "service role full album photos"
  on public.album_photos
  for all
  to service_role
  using (true)
  with check (true);

drop trigger if exists album_photos_updated_at on public.album_photos;
create trigger album_photos_updated_at
before update on public.album_photos
for each row
execute function public.handle_updated_at();

-- ================================================================
-- 5) Seed data — migrate the 8 portfolio_items into albums + one photo each.
--    Only runs if albums table is empty so existing data is preserved.
-- ================================================================

do $$
declare
  album_count integer;
  a_id uuid;
begin
  select count(*) into album_count from public.albums;
  if album_count = 0 then

    -- 1. Weddings — The Ceremony
    insert into public.albums (id, category, title, location, cover_image_url, description, sort_order)
    values (gen_random_uuid(), 'Weddings', 'The Ceremony', 'Alibaug · 2025',
            '/assets/service-wedding-BZurNPet.jpg',
            'A quiet morning ceremony framed by the people who knew them longest. Documentary coverage, natural light.', 0)
    returning id into a_id;
    insert into public.album_photos (album_id, image_url, alt, sort_order)
    values (a_id, '/assets/service-wedding-BZurNPet.jpg', 'Wedding ceremony framed by guests', 0);

    -- 2. Weddings — Golden Hour
    insert into public.albums (id, category, title, location, cover_image_url, description, sort_order)
    values (gen_random_uuid(), 'Weddings', 'Golden Hour', 'Udaipur · 2025',
            '/assets/wedding-hero-Br79cHkN.jpg',
            'Portraits and quiet moments at golden hour on the palace steps before the reception.', 1)
    returning id into a_id;
    insert into public.album_photos (album_id, image_url, alt, sort_order)
    values (a_id, '/assets/wedding-hero-Br79cHkN.jpg', 'Bride in a flowing dress at golden hour', 0);

    -- 3. Pre-Weddings — Before The Vows
    insert into public.albums (id, category, title, location, cover_image_url, description, sort_order)
    values (gen_random_uuid(), 'Pre-Weddings', 'Before The Vows', 'Goa · 2025',
            '/assets/prewedding-dusk-BF_f7_Q6.jpg',
            'A relaxed pre-wedding session by the sea. Sunsets, wind in hair, and no rushed timelines.', 2)
    returning id into a_id;
    insert into public.album_photos (album_id, image_url, alt, sort_order)
    values (a_id, '/assets/prewedding-dusk-BF_f7_Q6.jpg', 'Couple silhouetted against a coastal sunset', 0);

    -- 4. Pre-Weddings — The In-Between
    insert into public.albums (id, category, title, location, cover_image_url, description, sort_order)
    values (gen_random_uuid(), 'Pre-Weddings', 'The In-Between', 'Lonavala · 2024',
            '/assets/wedding-hero-DSQ3HUHK.jpg',
            'The moments between posed shots — when everyone forgets the camera is there.', 3)
    returning id into a_id;
    insert into public.album_photos (album_id, image_url, alt, sort_order)
    values (a_id, '/assets/wedding-hero-DSQ3HUHK.jpg', 'Bride walking through a sunlit landscape', 0);

    -- 5. Products — Quiet Objects
    insert into public.albums (id, category, title, location, cover_image_url, description, sort_order)
    values (gen_random_uuid(), 'Products', 'Quiet Objects', 'Mumbai · 2025',
            '/assets/service-product-BBqJ_b8-.jpg',
            'Minimal product stills for a fragrance line. Studio work, warm north light.', 4)
    returning id into a_id;
    insert into public.album_photos (album_id, image_url, alt, sort_order)
    values (a_id, '/assets/service-product-BBqJ_b8-.jpg', 'Minimal perfume bottle on a studio set', 0);

    -- 6. Events — After Dark
    insert into public.albums (id, category, title, location, cover_image_url, description, sort_order)
    values (gen_random_uuid(), 'Events', 'After Dark', 'Delhi · 2024',
            '/assets/reception-night-DmPA3Zc5.jpg',
            'A private reception after midnight. String lights, live music, and a very full dance floor.', 5)
    returning id into a_id;
    insert into public.album_photos (album_id, image_url, alt, sort_order)
    values (a_id, '/assets/reception-night-DmPA3Zc5.jpg', 'Guests dancing at a night reception', 0);

    -- 7. Corporate — The Gathering
    insert into public.albums (id, category, title, location, cover_image_url, description, sort_order)
    values (gen_random_uuid(), 'Corporate', 'The Gathering', 'Bengaluru · 2024',
            '/assets/service-wedding-BZurNPet.jpg',
            'A product launch for a consumer tech brand. Coverage of keynote, audience, and after-party.', 6)
    returning id into a_id;
    insert into public.album_photos (album_id, image_url, alt, sort_order)
    values (a_id, '/assets/service-wedding-BZurNPet.jpg', 'Audience gathered in a bright venue', 0);

    -- 8. Baby & Kids — The Little Years
    insert into public.albums (id, category, title, location, cover_image_url, description, sort_order)
    values (gen_random_uuid(), 'Baby & Kids', 'The Little Years', 'Pune · 2024',
            '/assets/rings-detail-Cp0BQSVQ.jpg',
            'An at-home family session with a toddler and grandparents. Natural light, no props.', 7)
    returning id into a_id;
    insert into public.album_photos (album_id, image_url, alt, sort_order)
    values (a_id, '/assets/rings-detail-Cp0BQSVQ.jpg', 'A warm close-up detail in soft light', 0);

  end if;
end $$;
