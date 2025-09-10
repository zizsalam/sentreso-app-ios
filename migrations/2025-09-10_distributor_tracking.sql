-- ===========================
-- SENTRESO: Distributor tracking (Option B)
-- ===========================

-- 0) Ensure pgcrypto (for gen_random_uuid) is available
create extension if not exists pgcrypto;

-- 1) customers.created_by  (the distributor/agent who onboarded the merchant)
alter table public.customers
  add column if not exists created_by uuid;

-- 2) Trigger: set created_by from JWT (agent’s auth.uid()) if not provided
create or replace function public.set_created_by()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end
$$;

drop trigger if exists set_created_by_on_customers on public.customers;
create trigger set_created_by_on_customers
  before insert on public.customers
  for each row
  execute procedure public.set_created_by();

-- 3) (Re)attach user_id trigger if you use it on customers as well
--    This matches the pattern we used on transactions.
create or replace function public.set_user_id()
returns trigger language plpgsql as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists set_user_id_on_customers on public.customers;
create trigger set_user_id_on_customers
  before insert on public.customers
  for each row execute procedure public.set_user_id();

-- 4) RLS policies for customers (owner-only; insert allows trigger to fill user_id)
alter table public.customers enable row level security;

drop policy if exists customers_owner_select on public.customers;
drop policy if exists customers_owner_insert on public.customers;
drop policy if exists customers_owner_update on public.customers;
drop policy if exists customers_owner_delete on public.customers;

create policy customers_owner_select
  on public.customers
  for select
  using (auth.uid() = user_id);

create policy customers_owner_insert
  on public.customers
  for insert
  with check ( user_id is null or auth.uid() = user_id );

create policy customers_owner_update
  on public.customers
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy customers_owner_delete
  on public.customers
  for delete
  using (auth.uid() = user_id);

-- 5) Distributor productivity view
drop view if exists public.metrics_distributor cascade;
create view public.metrics_distributor as
select
  created_by as distributor_id,
  count(*)   as merchants_added
from public.customers
group by created_by
order by merchants_added desc;

-- 6) Helpful indexes
create index if not exists idx_customers_created_by on public.customers(created_by);
create index if not exists idx_customers_user_id    on public.customers(user_id);
create index if not exists idx_customers_created_at on public.customers(created_at);
