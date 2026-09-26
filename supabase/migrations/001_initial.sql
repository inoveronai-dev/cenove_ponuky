-- MoveQuote initial schema
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Moja firma',
  subtitle text,
  address text,
  ico text,
  dic text,
  ic_dph text,
  email text,
  phone text,
  website text,
  logo_url text,
  primary_color text not null default '#1a1a1a',
  quote_validity_days integer not null default 14,
  notify_on_first_open boolean not null default true,
  notify_on_later_open boolean not null default true,
  notification_cooldown_hours integer not null default 3,
  notification_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists company_members_user_id_idx on public.company_members (user_id);
create index if not exists company_members_company_id_idx on public.company_members (company_id);

-- ---------------------------------------------------------------------------
-- Pricing settings (1:1 company)
-- ---------------------------------------------------------------------------
create table if not exists public.pricing_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies (id) on delete cascade,
  hourly_rate_per_worker numeric(10, 2) not null default 38,
  kilometer_rate numeric(10, 4) not null default 0.65,
  route_multiplier numeric(10, 4) not null default 1,
  fixed_fee numeric(10, 2) not null default 90,
  disassembly_surcharge numeric(10, 2) not null default 70,
  assembly_surcharge numeric(10, 2) not null default 70,
  packing_surcharge numeric(10, 2) not null default 80,
  packing_material_surcharge numeric(10, 2) not null default 40,
  heavy_items_surcharge numeric(10, 2) not null default 60,
  disposal_surcharge numeric(10, 2) not null default 50,
  protective_wrapping_surcharge numeric(10, 2) not null default 45,
  other_surcharge numeric(10, 2) not null default 0,
  minimum_job_price numeric(10, 2) not null default 0,
  weekend_surcharge_percent numeric(10, 2) not null default 0,
  evening_surcharge_percent numeric(10, 2) not null default 0,
  buffer_min_multiplier numeric(10, 4) not null default 0.92,
  buffer_max_multiplier numeric(10, 4) not null default 1.12,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Quotes
-- ---------------------------------------------------------------------------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  company_id uuid not null references public.companies (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  status text not null default 'ready'
    check (status in ('draft', 'ready', 'sent', 'opened')),
  customer_first_name text,
  customer_last_name text,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  origin_address text,
  destination_address text,
  origin_property_type text,
  origin_floor integer,
  origin_elevator boolean,
  destination_floor integer,
  destination_elevator boolean,
  distance_km numeric(10, 2),
  box_count integer,
  large_items text,
  wardrobes_count integer,
  beds_count integer,
  sofas_count integer,
  appliances_count integer,
  disassembly boolean not null default false,
  assembly boolean not null default false,
  packing boolean not null default false,
  packing_material boolean not null default false,
  disposal boolean not null default false,
  heavy_items boolean not null default false,
  protective_wrapping boolean not null default false,
  other_service boolean not null default false,
  additional_services jsonb not null default '{}'::jsonb,
  move_date date,
  estimated_hours numeric(10, 2),
  workers integer,
  vehicle_type text,
  is_weekend boolean not null default false,
  is_evening boolean not null default false,
  internal_notes text,
  customer_notes text,
  ai_intro text,
  ai_summary text,
  ai_scope_note text,
  labor_amount numeric(12, 2),
  transport_amount numeric(12, 2),
  extras_amount numeric(12, 2),
  base_estimate numeric(12, 2),
  price_min numeric(12, 2),
  price_max numeric(12, 2),
  price_is_manual boolean not null default false,
  valid_until date,
  sent_at timestamptz,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer not null default 0,
  unique_session_count integer not null default 0,
  last_notified_at timestamptz,
  version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_company_created_idx
  on public.quotes (company_id, created_at desc);
create index if not exists quotes_public_id_idx on public.quotes (public_id);
create index if not exists quotes_status_idx on public.quotes (company_id, status);
create index if not exists quotes_customer_name_idx
  on public.quotes (company_id, customer_name);

-- ---------------------------------------------------------------------------
-- Quote versions (history when editing sent/opened)
-- ---------------------------------------------------------------------------
create table if not exists public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (quote_id, version_number)
);

create index if not exists quote_versions_quote_id_idx
  on public.quote_versions (quote_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Quote views
-- ---------------------------------------------------------------------------
create table if not exists public.quote_views (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  session_id text,
  user_agent text,
  referrer text,
  -- Hashed IP for abuse/session heuristics only — never shown in dashboard
  ip_hash text
);

create index if not exists quote_views_quote_viewed_idx
  on public.quote_views (quote_id, viewed_at desc);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  email_status text not null default 'skipped'
    check (email_status in ('pending', 'sent', 'failed', 'skipped')),
  email_error text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at, created_at desc);
create index if not exists notifications_company_idx
  on public.notifications (company_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists pricing_settings_updated_at on public.pricing_settings;
create trigger pricing_settings_updated_at
  before update on public.pricing_settings
  for each row execute function public.set_updated_at();

drop trigger if exists quotes_updated_at on public.quotes;
create trigger quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- Membership helper (security definer to avoid RLS recursion)
create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.user_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.company_members
  where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Onboarding: create profile + company + pricing on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Používateľ'
  );

  insert into public.profiles (id, full_name, email)
  values (new.id, display_name, new.email)
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);

  insert into public.companies (
    name,
    subtitle,
    notification_email
  )
  values (
    'Moja firma',
    'Profesionálne sťahovanie domácností a firiem',
    new.email
  )
  returning id into new_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (new_company_id, new.id, 'owner');

  insert into public.pricing_settings (company_id)
  values (new_company_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_versions enable row level security;
alter table public.quote_views enable row level security;
alter table public.notifications enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Companies
drop policy if exists "companies_select_member" on public.companies;
create policy "companies_select_member" on public.companies
  for select using (public.is_company_member(id));

drop policy if exists "companies_update_member" on public.companies;
create policy "companies_update_member" on public.companies
  for update using (public.is_company_member(id));

-- Company members
drop policy if exists "company_members_select" on public.company_members;
create policy "company_members_select" on public.company_members
  for select using (public.is_company_member(company_id));

-- Pricing
drop policy if exists "pricing_select_member" on public.pricing_settings;
create policy "pricing_select_member" on public.pricing_settings
  for select using (public.is_company_member(company_id));

drop policy if exists "pricing_update_member" on public.pricing_settings;
create policy "pricing_update_member" on public.pricing_settings
  for update using (public.is_company_member(company_id));

-- Quotes: members only — public pages use service role server-side
drop policy if exists "quotes_select_member" on public.quotes;
create policy "quotes_select_member" on public.quotes
  for select using (public.is_company_member(company_id));

drop policy if exists "quotes_insert_member" on public.quotes;
create policy "quotes_insert_member" on public.quotes
  for insert with check (public.is_company_member(company_id));

drop policy if exists "quotes_update_member" on public.quotes;
create policy "quotes_update_member" on public.quotes
  for update using (public.is_company_member(company_id));

drop policy if exists "quotes_delete_member" on public.quotes;
create policy "quotes_delete_member" on public.quotes
  for delete using (public.is_company_member(company_id));

-- Quote versions
drop policy if exists "quote_versions_select" on public.quote_versions;
create policy "quote_versions_select" on public.quote_versions
  for select using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.is_company_member(q.company_id)
    )
  );

drop policy if exists "quote_versions_insert" on public.quote_versions;
create policy "quote_versions_insert" on public.quote_versions
  for insert with check (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.is_company_member(q.company_id)
    )
  );

-- Quote views: members can read; inserts via service role only
drop policy if exists "quote_views_select" on public.quote_views;
create policy "quote_views_select" on public.quote_views
  for select using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.is_company_member(q.company_id)
    )
  );

-- Notifications
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using (
    user_id = auth.uid() or public.is_company_member(company_id)
  );

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update using (
    user_id = auth.uid() or public.is_company_member(company_id)
  );

-- ---------------------------------------------------------------------------
-- Storage: company logos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

drop policy if exists "company_logos_public_read" on storage.objects;
create policy "company_logos_public_read" on storage.objects
  for select using (bucket_id = 'company-logos');

drop policy if exists "company_logos_member_upload" on storage.objects;
create policy "company_logos_member_upload" on storage.objects
  for insert with check (
    bucket_id = 'company-logos'
    and auth.role() = 'authenticated'
  );

drop policy if exists "company_logos_member_update" on storage.objects;
create policy "company_logos_member_update" on storage.objects
  for update using (
    bucket_id = 'company-logos'
    and auth.role() = 'authenticated'
  );

drop policy if exists "company_logos_member_delete" on storage.objects;
create policy "company_logos_member_delete" on storage.objects
  for delete using (
    bucket_id = 'company-logos'
    and auth.role() = 'authenticated'
  );
