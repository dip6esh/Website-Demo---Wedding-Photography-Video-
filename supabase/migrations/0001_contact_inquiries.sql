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
  on public.contact_inquiries
  for insert
  to anon
  with check (true);

drop policy if exists "service role can read contact inquiries" on public.contact_inquiries;
create policy "service role can read contact inquiries"
  on public.contact_inquiries
  for select
  to service_role
  using (true);

drop policy if exists "service role can update contact inquiries" on public.contact_inquiries;
create policy "service role can update contact inquiries"
  on public.contact_inquiries
  for update
  to service_role
  using (true)
  with check (true);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contact_inquiries_updated_at on public.contact_inquiries;
create trigger contact_inquiries_updated_at
before update on public.contact_inquiries
for each row
execute function public.handle_updated_at();
