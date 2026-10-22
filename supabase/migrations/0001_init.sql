-- Spicy Hemp: initial schema.
-- Content tables are filled by the Notion sync; operational tables are written only by the server (service role).

create extension if not exists pgcrypto;

-- ---------- content (public read) ----------
create table public.families (
  slug text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.species (
  slug text primary key,
  family text not null references public.families (slug),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.content_sync_log (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  source text not null,
  status text not null,
  changed int not null default 0,
  error text
);

-- ---------- production ----------
create table public.batches (
  code text primary key,
  made_on date not null default current_date,
  notes text
);

create table public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null check (status in ('new','pending_payment','paid','packed','shipped','delivered','cancelled')),
  data jsonb not null
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create table public.pots (
  code text primary key check (code ~ '^[2-9A-HJ-NP-Z]{8}$'),
  species text not null,
  batch text not null,
  planted_on date not null,
  status text not null default 'planted' check (status in ('planted','reserved','sold','returned')),
  order_id text references public.orders (id)
);
create index pots_species_status_idx on public.pots (species, status);
create index pots_order_idx on public.pots (order_id);

-- ---------- analytics ----------
create table public.scan_events (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  pot_code text,
  species text,
  country text,
  device text not null,
  os text not null,
  referrer text,
  visitor text not null,         -- daily-salted hash, never an IP address
  first_scan boolean not null default false,
  valid boolean not null default true
);
create index scan_events_ts_idx on public.scan_events (ts desc);
create index scan_events_pot_idx on public.scan_events (pot_code, visitor);

create materialized view public.scan_daily as
  select date_trunc('day', ts)::date as day, species, country, count(*) as scans,
         count(distinct visitor) as visitors
  from public.scan_events
  where valid
  group by 1, 2, 3;
create unique index scan_daily_uidx on public.scan_daily (day, species, country);

-- ---------- row level security ----------
alter table public.families enable row level security;
alter table public.species enable row level security;
alter table public.content_sync_log enable row level security;
alter table public.batches enable row level security;
alter table public.orders enable row level security;
alter table public.pots enable row level security;
alter table public.scan_events enable row level security;

-- Public site content is readable by everyone; everything else has NO policy,
-- so only the service role (server code) can touch it.
create policy "content is public" on public.families for select using (true);
create policy "content is public" on public.species for select using (true);

revoke all on public.scan_daily from anon, authenticated;
