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
