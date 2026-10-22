-- Spicy Hemp: baskets/singles, owners (Telegram), care journal, questions, reminders, e-commerce states.
-- Additive on top of 0001. Operational tables are written only by server code (service role);
-- admins authenticated through Supabase Auth additionally get full access via public.is_admin().

-- ---------- helpers ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- admins (Supabase Auth users; e-mail + password) ----------
create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'manager' check (role in ('owner','manager','support')),
  display_name text,
  telegram_id bigint unique,
  created_at timestamptz not null default now()
);

create table public.admin_link_codes (          -- one-time codes for /admin_link in the bot
  code text primary key,
  user_id uuid not null references public.admin_profiles (user_id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid());
$$;

-- ---------- owners (buyers who activated an item; identity comes from Telegram) ----------
create table public.owners (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  username text,
  first_name text,
  locale text not null default 'uk' check (locale in ('uk','en')),
  timezone text not null default 'Europe/Kyiv',
  notify boolean not null default true,
  quiet_from time not null default '21:00',
  quiet_until time not null default '08:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger owners_touch before update on public.owners for each row execute function public.touch_updated_at();

-- ---------- catalog: products (storefront types) ----------
create table public.products (
  slug text primary key,
  kind text not null check (kind in ('basket','single')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  price_uah integer not null check (price_uah >= 0),
  stock_mode text not null default 'made_to_order' check (stock_mode in ('in_stock','made_to_order')),
  data jsonb not null default '{}'::jsonb,       -- localized title, tagline, photos
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create table public.product_species (            -- composition of a product (1..n herbs)
  product text not null references public.products (slug) on delete cascade,
  species text not null references public.species (slug),
  qty integer not null default 1 check (qty > 0),
  primary key (product, species)
);

create table public.product_content (            -- care sections shown on the card, per language
  product text not null references public.products (slug) on delete cascade,
  locale text not null check (locale in ('uk','en')),
  section text not null check (section in ('description','watering','placement','seasonal','katya_tips','kitchen')),
  body text not null,
  primary key (product, locale, section)
);

-- ---------- items: a physical basket/pot with a QR code ----------
create table public.items (
  code text primary key check (code ~ '^[2-9A-HJ-NP-Z]{8}$'),   -- same alphabet as legacy pots
  display_no integer not null default 0,                       -- numbered per kind, shown as "САД · 001" / "РОСЛИНА · 001"
  product text references public.products (slug),              -- null for legacy single pots
  kind text not null check (kind in ('basket','single')),
  batch text,
  status text not null default 'draft' check (status in
    ('draft','ready_for_sale','reserved','sold','shipped','delivered','activated','returned','written_off','archived')),
  ready_on date,
  order_id text references public.orders (id),
  owner_id uuid references public.owners (id),
  owner_name text check (owner_name is null or char_length(owner_name) <= 60),   -- the name the owner gave the garden
  activated_at timestamptz,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((owner_id is null) = (activated_at is null)),
  unique (kind, display_no)
);
create sequence public.items_basket_no_seq;
create sequence public.items_single_no_seq;
create or replace function public.assign_item_no() returns trigger language plpgsql as $$
begin
  if new.display_no = 0 then
    new.display_no := case new.kind when 'basket' then nextval('public.items_basket_no_seq') else nextval('public.items_single_no_seq') end;
  end if;
  return new;
end $$;
create trigger items_assign_no before insert on public.items for each row execute function public.assign_item_no();
create index items_status_idx on public.items (status);
create index items_order_idx on public.items (order_id);
create index items_owner_idx on public.items (owner_id);
create trigger items_touch before update on public.items for each row execute function public.touch_updated_at();

create table public.item_species (
  item text not null references public.items (code) on delete cascade,
  species text not null references public.species (slug),
  qty integer not null default 1 check (qty > 0),
  primary key (item, species)
);

create table public.item_content (               -- per-item overrides of product sections
  item text not null references public.items (code) on delete cascade,
  locale text not null check (locale in ('uk','en')),
  section text not null check (section in ('description','watering','placement','seasonal','katya_tips','kitchen')),
  body text not null,
  primary key (item, locale, section)
);

-- ---------- care journal ----------
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  item_code text not null references public.items (code) on delete cascade,
  owner_id uuid references public.owners (id),
  kind text not null check (kind in ('care','photo_report','problem','question','harvest','note')),
  entry_date date not null default current_date,
  source text not null default 'miniapp' check (source in ('miniapp','bot','admin')),
  light text check (light in ('bright','diffused','low')),
  watered boolean,
  note text check (note is null or char_length(note) <= 2000),
  symptom text,
  photos text[] not null default '{}' check (cardinality(photos) <= 6),   -- storage paths in the private "journal" bucket
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index journal_item_date_idx on public.journal_entries (item_code, entry_date desc);
create index journal_kind_idx on public.journal_entries (kind);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  item_code text not null references public.items (code) on delete cascade,
  entry_id uuid references public.journal_entries (id) on delete set null,
  owner_id uuid references public.owners (id),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'open' check (status in ('open','answered','closed')),
  answer text,
  answered_by uuid references public.admin_profiles (user_id),
  answered_at timestamptz,
  admin_tg_message_id bigint,                    -- message in Katya's chat, used to match reply-to answers
  created_at timestamptz not null default now(),
  check (status = 'open' or answer is not null or status = 'closed')
);
create index questions_status_idx on public.questions (status, created_at);

-- ---------- reviews with optional customer photos (shown on product pages only after consent + moderation) ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product text not null references public.products (slug) on delete cascade,
  item_code text references public.items (code) on delete set null,
  owner_id uuid references public.owners (id),
  rating smallint not null check (rating between 1 and 5),
  body text check (body is null or char_length(body) <= 1000),
  author_name text check (author_name is null or char_length(author_name) <= 40),
  locale text not null default 'uk' check (locale in ('uk','en')),
  photos text[] not null default '{}' check (cardinality(photos) <= 3),   -- paths in the public "reviews" bucket (copied there on approval)
  consent_public boolean not null default false,                         -- the owner agreed to publish text and photos
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  moderated_by uuid references public.admin_profiles (user_id),
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'approved' or consent_public)                         -- nothing goes public without consent
);
create index reviews_product_idx on public.reviews (product, status, created_at desc);

-- ---------- care schedule and reminders ----------
create table public.care_templates (             -- set by Katya per species
  species text not null references public.species (slug) on delete cascade,
  task text not null check (task in ('water','feed','prune','rotate','photo')),
  every_days integer not null check (every_days between 1 and 365),
  month_from smallint not null default 1 check (month_from between 1 and 12),
  month_to smallint not null default 12 check (month_to between 1 and 12),
  primary key (species, task)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  item_code text not null references public.items (code) on delete cascade,
  owner_id uuid not null references public.owners (id) on delete cascade,
  task text not null check (task in ('water','feed','prune','rotate','photo')),
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','sent','done','snoozed','skipped')),
  sent_at timestamptz,
  done_at timestamptz,
  unique (item_code, task, due_at)
);
create index reminders_due_idx on public.reminders (due_at) where status in ('pending','snoozed');

-- ---------- e-commerce: richer order states, events, payments, shipments ----------
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check (status in
  ('new','pending_payment','cod_confirmed','payment_failed','paid','processing','packed','shipped','delivered',
   'completed','cancelled','refund_requested','refunded','return_requested','returned'));

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders (id) on delete cascade,
  ts timestamptz not null default now(),
  from_status text,
  to_status text not null,
  actor_type text not null check (actor_type in ('system','admin','webhook','customer')),
  actor text,
  note text
);
create index order_events_order_idx on public.order_events (order_id, ts);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  provider text not null check (provider in ('cod','stripe','liqpay')),
  status text not null default 'pending' check (status in ('pending','succeeded','failed','refunded')),
  amount_minor integer not null check (amount_minor >= 0),
  currency text not null default 'UAH' check (currency in ('UAH','EUR')),
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index payments_provider_ref_uidx on public.payments (provider, provider_ref) where provider_ref is not null;
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated_at();

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  carrier text not null default 'nova_poshta',
  ttn text,
  status text not null default 'created',
  city text,
  warehouse text,
  updated_at timestamptz not null default now()
);
create trigger shipments_touch before update on public.shipments for each row execute function public.touch_updated_at();

-- ---------- allowed state transitions (mirrors src/lib/domain.ts) ----------
create table public.item_transitions (from_status text not null, to_status text not null, primary key (from_status, to_status));
create table public.order_transitions (from_status text not null, to_status text not null, primary key (from_status, to_status));

insert into public.item_transitions values
  ('draft','ready_for_sale'),('draft','archived'),
  ('ready_for_sale','reserved'),('ready_for_sale','sold'),('ready_for_sale','archived'),('ready_for_sale','written_off'),
  ('reserved','ready_for_sale'),('reserved','sold'),
  ('sold','shipped'),('sold','ready_for_sale'),('sold','returned'),
  ('shipped','delivered'),('shipped','returned'),
  ('delivered','activated'),('delivered','returned'),
  ('activated','archived'),('activated','returned'),
  ('returned','ready_for_sale'),('returned','written_off');

insert into public.order_transitions values
  ('new','pending_payment'),('new','cod_confirmed'),('new','cancelled'),
  ('pending_payment','paid'),('pending_payment','payment_failed'),('pending_payment','cancelled'),
  ('payment_failed','pending_payment'),('payment_failed','cancelled'),
  ('cod_confirmed','processing'),('cod_confirmed','packed'),('cod_confirmed','cancelled'),
  ('paid','processing'),('paid','packed'),('paid','refund_requested'),('paid','cancelled'),
  ('processing','packed'),('processing','refund_requested'),('processing','cancelled'),
  ('packed','shipped'),('packed','cancelled'),
  ('shipped','delivered'),('shipped','return_requested'),
  ('delivered','completed'),('delivered','return_requested'),
  ('completed','return_requested'),
  ('refund_requested','refunded'),('refund_requested','paid'),
  ('return_requested','returned'),('return_requested','completed'),
  ('returned','refunded');

create or replace function public.enforce_item_transition() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status
     and not exists (select 1 from public.item_transitions where from_status = old.status and to_status = new.status) then
    raise exception 'item % cannot go from % to %', old.code, old.status, new.status using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger items_status_guard before update of status on public.items for each row execute function public.enforce_item_transition();

create or replace function public.enforce_order_transition() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status
     and not exists (select 1 from public.order_transitions where from_status = old.status and to_status = new.status) then
    raise exception 'order % cannot go from % to %', old.id, old.status, new.status using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger orders_status_guard before update of status on public.orders for each row execute function public.enforce_order_transition();

-- every status change is recorded (actor defaults to system; the app can insert richer events itself and set app.skip_order_event)
create or replace function public.log_order_status() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status and coalesce(current_setting('app.skip_order_event', true), '') <> 'on' then
    insert into public.order_events (order_id, from_status, to_status, actor_type) values (new.id, old.status, new.status, 'system');
  end if;
  return new;
end $$;
create trigger orders_status_log after update of status on public.orders for each row execute function public.log_order_status();

-- ---------- backfill: legacy pots become single items ----------
insert into public.items (code, kind, batch, status, ready_on, order_id)
select code, 'single', batch,
  case status when 'planted' then 'ready_for_sale' when 'reserved' then 'reserved' when 'sold' then 'sold' else 'returned' end,
  planted_on, order_id
from public.pots
on conflict (code) do nothing;

insert into public.item_species (item, species)
select code, species from public.pots where species in (select slug from public.species)
on conflict do nothing;

-- ---------- private storage for journal photos ----------
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('journal', 'journal', false) on conflict (id) do nothing;
    insert into storage.buckets (id, name, public) values ('reviews', 'reviews', true) on conflict (id) do nothing;
  end if;
end $$;

-- ---------- row level security ----------
alter table public.admin_profiles enable row level security;
alter table public.admin_link_codes enable row level security;
alter table public.owners enable row level security;
alter table public.products enable row level security;
alter table public.product_species enable row level security;
alter table public.product_content enable row level security;
alter table public.items enable row level security;
alter table public.item_species enable row level security;
alter table public.item_content enable row level security;
alter table public.journal_entries enable row level security;
alter table public.questions enable row level security;
alter table public.reviews enable row level security;
alter table public.care_templates enable row level security;
alter table public.reminders enable row level security;
alter table public.order_events enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.item_transitions enable row level security;
alter table public.order_transitions enable row level security;

-- Public: only published storefront data. Owners have no database login (they act through server routes
-- that verify Telegram initData), so journal/owner/item tables have no public policy at all.
create policy "published products are public" on public.products for select using (status = 'published');
create policy "composition of published products is public" on public.product_species for select
  using (exists (select 1 from public.products p where p.slug = product and p.status = 'published'));
create policy "content of published products is public" on public.product_content for select
  using (exists (select 1 from public.products p where p.slug = product and p.status = 'published'));
create policy "approved reviews are public" on public.reviews for select using (status = 'approved' and consent_public);
create policy "care templates are public" on public.care_templates for select using (true);

-- Admins (Supabase Auth + admin_profiles) get full access to operational data.
do $$
declare t text;
begin
  foreach t in array array['owners','products','product_species','product_content','items','item_species','item_content',
    'journal_entries','questions','reviews','care_templates','reminders','order_events','payments','shipments',
    'batches','orders','pots','scan_events','item_transitions','order_transitions'] loop
    execute format('create policy "admins manage" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

create policy "admins read own profile" on public.admin_profiles for select using (user_id = auth.uid() or public.is_admin());
-- admin_link_codes: no policy, server only.
