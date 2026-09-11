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

drop policy if exists "public can read portfolio" on public.portfolio_items;
create policy "public can read portfolio"
  on public.portfolio_items
  for select
  to anon, public
  using (true);

drop policy if exists "service role full portfolio" on public.portfolio_items;
create policy "service role full portfolio"
  on public.portfolio_items
  for all
  to service_role
  using (true)
  with check (true);

drop trigger if exists portfolio_items_updated_at on public.portfolio_items;
create trigger portfolio_items_updated_at
before update on public.portfolio_items
for each row
execute function public.handle_updated_at();

insert into public.portfolio_items (category, title, location, image_url, alt, sort_order)
values
  ('Weddings', 'The Ceremony', 'Alibaug · 2025', '/assets/service-wedding-BZurNPet.jpg', 'Wedding ceremony framed by guests', 0),
  ('Weddings', 'Golden Hour', 'Udaipur · 2025', '/assets/wedding-hero-Br79cHkN.jpg', 'Bride in a flowing dress at golden hour', 1),
  ('Pre-Weddings', 'Before The Vows', 'Goa · 2025', '/assets/prewedding-dusk-BF_f7_Q6.jpg', 'Couple silhouetted against a coastal sunset', 2),
  ('Pre-Weddings', 'The In-Between', 'Lonavala · 2024', '/assets/wedding-hero-DSQ3HUHK.jpg', 'Bride walking through a sunlit landscape', 3),
  ('Products', 'Quiet Objects', 'Mumbai · 2025', '/assets/service-product-BBqJ_b8-.jpg', 'Minimal perfume bottle on a studio set', 4),
  ('Events', 'After Dark', 'Delhi · 2024', '/assets/reception-night-DmPA3Zc5.jpg', 'Guests dancing at a night reception', 5),
  ('Corporate', 'The Gathering', 'Bengaluru · 2024', '/assets/service-wedding-BZurNPet.jpg', 'Audience gathered in a bright venue', 6),
  ('Baby & Kids', 'The Little Years', 'Pune · 2024', '/assets/rings-detail-Cp0BQSVQ.jpg', 'A warm close-up detail in soft light', 7)
on conflict (id) do nothing;
