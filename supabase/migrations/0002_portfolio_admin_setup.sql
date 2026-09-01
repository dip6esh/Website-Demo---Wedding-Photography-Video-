-- ================================================================
-- Love Story Capture (Vessel Studio) — Portfolio & Admin Setup
-- Paste this entire file into Supabase → SQL Editor → New Query
-- and press "Run". Do this ONCE per project.
--
-- What this creates:
--   1. `handle_updated_at()` trigger function (idempotent)
--   2. `contact_inquiries` table (idempotent — safe to re-run)
--   3. `portfolio_items` table (the "Works" gallery)
--   4. Storage bucket `portfolio-images` for uploaded images
--   5. Row-Level Security + storage policies matching the project's
--      two-key pattern (VITE_SUPABASE_ANON_KEY = browser public,
--      SUPABASE_SERVICE_ROLE_KEY = server-only admin writes)
--   6. Seed portfolio data matching the current site defaults
-- ================================================================

-- 1) shared updated-at trigger ------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) contact_inquiries (in case you haven't run migration 0001 yet) ------------

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  service text not null,
  event_date date not null,
  location text not null,
  message text not null,
  source text,
  ip_address inet,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_inquiries_created_at_idx
  on public.contact_inquiries (created_at desc);
create index if not exists contact_inquiries_status_idx
  on public.contact_inquiries (status);

alter table public.contact_inquiries enable row level security;

drop policy if exists "anon can insert contact inquiries" on public.contact_inquiries;
create policy "anon can insert contact inquiries"
  on public.contact_inquiries for insert to anon
  with check (true);

drop policy if exists "service role full contact inquiries" on public.contact_inquiries;
create policy "service role full contact inquiries"
  on public.contact_inquiries for all to service_role
  using (true) with check (true);

drop trigger if exists contact_inquiries_updated_at on public.contact_inquiries;
create trigger contact_inquiries_updated_at
before update on public.contact_inquiries for each row
execute function public.handle_updated_at();

-- 3) portfolio_items — the Works gallery ---------------------------------------

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  location text not null,
  image_url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_items_sort_order_idx
  on public.portfolio_items (sort_order asc, created_at asc);
create index if not exists portfolio_items_category_idx
  on public.portfolio_items (category);

alter table public.portfolio_items enable row level security;

-- Browser (anon key): read-only → Works page visitors can see the gallery
drop policy if exists "public can read portfolio" on public.portfolio_items;
create policy "public can read portfolio"
  on public.portfolio_items for select to anon, public
  using (true);

-- Server (service_role key): full CRUD → used by /admin server functions
drop policy if exists "service role full portfolio" on public.portfolio_items;
create policy "service role full portfolio"
  on public.portfolio_items for all to service_role
  using (true) with check (true);

drop trigger if exists portfolio_items_updated_at on public.portfolio_items;
create trigger portfolio_items_updated_at
before update on public.portfolio_items for each row
execute function public.handle_updated_at();

-- Seed data — the 8 items the site currently ships with.
-- `on conflict do nothing` so you can re-run this file safely.
insert into public.portfolio_items (id, category, title, location, image_url, alt, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Weddings',     'The Ceremony',     'Alibaug · 2025',   '/assets/service-wedding-BZurNPet.jpg', 'Wedding ceremony framed by guests',             0),
  ('00000000-0000-0000-0000-000000000002', 'Weddings',     'Golden Hour',      'Udaipur · 2025',   '/assets/wedding-hero-Br79cHkN.jpg',    'Bride in a flowing dress at golden hour',       1),
  ('00000000-0000-0000-0000-000000000003', 'Pre-Weddings', 'Before The Vows',  'Goa · 2025',       '/assets/prewedding-dusk-BF_f7_Q6.jpg', 'Couple silhouetted against a coastal sunset',   2),
  ('00000000-0000-0000-0000-000000000004', 'Pre-Weddings', 'The In-Between',   'Lonavala · 2024',  '/assets/wedding-hero-DSQ3HUHK.jpg',    'Bride walking through a sunlit landscape',      3),
  ('00000000-0000-0000-0000-000000000005', 'Products',     'Quiet Objects',    'Mumbai · 2025',    '/assets/service-product-BBqJ_b8-.jpg', 'Minimal perfume bottle on a studio set',        4),
  ('00000000-0000-0000-0000-000000000006', 'Events',       'After Dark',       'Delhi · 2024',     '/assets/reception-night-DmPA3Zc5.jpg', 'Guests dancing at a night reception',           5),
  ('00000000-0000-0000-0000-000000000007', 'Corporate',    'The Gathering',    'Bengaluru · 2024', '/assets/service-wedding-BZurNPet.jpg', 'Audience gathered in a bright venue',           6),
  ('00000000-0000-0000-0000-000000000008', 'Baby & Kids',  'The Little Years', 'Pune · 2024',      '/assets/rings-detail-Cp0BQSVQ.jpg',    'A warm close-up detail in soft light',          7)
on conflict (id) do nothing;

-- 4) storage bucket for uploaded portfolio images ------------------------------
-- The `storage` schema ships with Supabase. If for any reason the insert below
-- fails on a fresh project, first create the bucket manually via:
--   Supabase Dashboard → Storage → New bucket → name: `portfolio-images`, public: ON
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images',
  'portfolio-images',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 4a) Storage policies — mirror the same two-key pattern.
--     IMPORTANT: storage policies live on storage.objects, not the public schema.
--     The policies below are intentionally narrow:
--       • anon / public → GET files only (gallery visitors)
--       • service_role → full read/write (admin upload server function)

drop policy if exists "public can view portfolio images" on storage.objects;
create policy "public can view portfolio images"
  on storage.objects for select to anon, public
  using (bucket_id = 'portfolio-images');

drop policy if exists "service role can upload portfolio images" on storage.objects;
create policy "service role can upload portfolio images"
  on storage.objects for insert to service_role
  with check (bucket_id = 'portfolio-images');

drop policy if exists "service role can update portfolio images" on storage.objects;
create policy "service role can update portfolio images"
  on storage.objects for update to service_role
  using (bucket_id = 'portfolio-images')
  with check (bucket_id = 'portfolio-images');

drop policy if exists "service role can delete portfolio images" on storage.objects;
create policy "service role can delete portfolio images"
  on storage.objects for delete to service_role
  using (bucket_id = 'portfolio-images');

-- ================================================================
-- ALL DONE. After running:
--   • Supabase → Table Editor → portfolio_items should show 8 rows
--   • Supabase → Storage → portfolio-images bucket should exist (empty, public)
--   • You can add an ADMIN_SESSION_SECRET env var later in Project Settings
--     → API Keys for the /admin login. For now the admin login uses a
--     single shared password stored as ADMIN_PASSWORD in your .env.
-- ================================================================
