-- Public bucket for product photos uploaded from the admin (paths: <product>/<file>)
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('catalog', 'catalog', true) on conflict (id) do nothing;
  end if;
end $$;

-- Key/value settings written by the server (e.g. Telegram ids of the shop's admins). No public policy.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

-- Reminders: one per herb, plus the review request two weeks after activation
alter table public.reminders drop constraint if exists reminders_task_check;
alter table public.reminders add constraint reminders_task_check check (task in ('water','feed','prune','rotate','photo','review'));
alter table public.reminders add column if not exists species text references public.species (slug);
alter table public.reminders drop constraint if exists reminders_item_code_task_due_at_key;
alter table public.reminders add constraint reminders_item_task_species_due_key unique (item_code, task, species, due_at);

-- A question can carry the symptom the owner picked ("leaves turn yellow")
alter table public.questions add column if not exists symptom text;

-- Built-in products live in code and are not rows in public.products, so items and reviews refer to them by slug only
alter table public.items drop constraint if exists items_product_fkey;
alter table public.reviews drop constraint if exists reviews_product_fkey;
