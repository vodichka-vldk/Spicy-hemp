-- Public bucket for product photos uploaded from the admin (paths: <product>/<file>)
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('catalog', 'catalog', true) on conflict (id) do nothing;
  end if;
end $$;
