-- === 0) Pre-flight: Extensions (if needed)
create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

-- === 1) Ownership columns & constraints (idempotent checks recommended)
-- Customers table
alter table if exists public.customers
  add column if not exists user_id uuid;

alter table if exists public.customers
  add constraint customers_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Transactions table
alter table if exists public.transactions
  add column if not exists user_id uuid;

alter table if exists public.transactions
  add constraint transactions_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table if exists public.transactions
  alter column amount set not null,
  alter column "type" set not null,
  alter column "timestamp" set not null;

-- Customer interactions
alter table if exists public.customer_interactions
  add column if not exists user_id uuid;

alter table if exists public.customer_interactions
  add constraint interactions_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Receipts (if present)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'receipts'
  ) then
    execute $x$
      alter table public.receipts
        add column if not exists user_id uuid;
      alter table public.receipts
        add constraint receipts_user_fk
        foreign key (user_id) references auth.users(id) on delete cascade;
    $x$;
  end if;
end$$;

-- === 2) Enable RLS on user data tables
alter table if exists public.customers enable row level security;
alter table if exists public.transactions enable row level security;
alter table if exists public.customer_interactions enable row level security;
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'receipts'
  ) then
    execute 'alter table public.receipts enable row level security;';
  end if;
end$$;

-- === 3) Helper: consistent policy expressions
-- Policy pattern: Only owner (auth.uid() = user_id) can SELECT, INSERT, UPDATE, DELETE.

-- Customers
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
  with check (auth.uid() = user_id);

create policy customers_owner_update
  on public.customers
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy customers_owner_delete
  on public.customers
  for delete
  using (auth.uid() = user_id);

-- Transactions
drop policy if exists tx_owner_select on public.transactions;
drop policy if exists tx_owner_insert on public.transactions;
drop policy if exists tx_owner_update on public.transactions;
drop policy if exists tx_owner_delete on public.transactions;

create policy tx_owner_select
  on public.transactions
  for select
  using (auth.uid() = user_id);

create policy tx_owner_insert
  on public.transactions
  for insert
  with check (auth.uid() = user_id);

create policy tx_owner_update
  on public.transactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy tx_owner_delete
  on public.transactions
  for delete
  using (auth.uid() = user_id);

-- Customer interactions
drop policy if exists interactions_owner_select on public.customer_interactions;
drop policy if exists interactions_owner_insert on public.customer_interactions;
drop policy if exists interactions_owner_update on public.customer_interactions;
drop policy if exists interactions_owner_delete on public.customer_interactions;

create policy interactions_owner_select
  on public.customer_interactions
  for select
  using (auth.uid() = user_id);

create policy interactions_owner_insert
  on public.customer_interactions
  for insert
  with check (auth.uid() = user_id);

create policy interactions_owner_update
  on public.customer_interactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy interactions_owner_delete
  on public.customer_interactions
  for delete
  using (auth.uid() = user_id);

-- Receipts (if present)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'receipts'
  ) then
    execute $x$
      drop policy if exists receipts_owner_select on public.receipts;
      drop policy if exists receipts_owner_insert on public.receipts;
      drop policy if exists receipts_owner_update on public.receipts;
      drop policy if exists receipts_owner_delete on public.receipts;

      create policy receipts_owner_select
        on public.receipts
        for select
        using (auth.uid() = user_id);

      create policy receipts_owner_insert
        on public.receipts
        for insert
        with check (auth.uid() = user_id);

      create policy receipts_owner_update
        on public.receipts
        for update
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);

      create policy receipts_owner_delete
        on public.receipts
        for delete
        using (auth.uid() = user_id);
    $x$;
  end if;
end$$;

-- === 4) Harden security_audit_log
-- RLS ON, deny to authenticated users, allow only service_role (via role check).
alter table if exists public.security_audit_log enable row level security;

drop policy if exists audit_deny_all on public.security_audit_log;
create policy audit_deny_all
  on public.security_audit_log
  for all
  using (false)
  with check (false);

-- Optional: create a special read policy for service_role
-- Supabase injects 'role' claim for service role; allow select when jwt role = 'service_role'.
drop policy if exists audit_service_role_read on public.security_audit_log;
create policy audit_service_role_read
  on public.security_audit_log
  for select
  using ( current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role' );

-- === 5) Fix SECURITY DEFINER view
-- Drop and recreate 'financial_insights' as SECURITY INVOKER (default), or wrap as a function with RLS-safe selects.
drop view if exists public.financial_insights;

-- Example safe view (adjust columns/joins for your schema):
create view public.financial_insights as
select
  t.id as transaction_id,
  t.user_id,
  t.amount,
  t."type",
  t."timestamp"
from public.transactions t;

-- Ensure no SECURITY DEFINER:
-- (Views are SECURITY INVOKER by default; do not set security definer.)

-- === 6) Minimal correctness indexes (optional but good)
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_customers_user_id on public.customers(user_id);
create index if not exists idx_interactions_user_id on public.customer_interactions(user_id);

-- === 7) Server-side enforcement of user_id via trigger (preferred)
create or replace function public.set_user_id()
returns trigger language plpgsql as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end $$;

-- Transactions trigger
drop trigger if exists set_user_id_on_transactions on public.transactions;
create trigger set_user_id_on_transactions before insert on public.transactions
for each row execute procedure public.set_user_id();

-- Customers trigger
drop trigger if exists set_user_id_on_customers on public.customers;
create trigger set_user_id_on_customers before insert on public.customers
for each row execute procedure public.set_user_id();

-- Customer interactions trigger
drop trigger if exists set_user_id_on_customer_interactions on public.customer_interactions;
create trigger set_user_id_on_customer_interactions before insert on public.customer_interactions
for each row execute procedure public.set_user_id();

-- Receipts trigger (if present)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'receipts'
  ) then
    execute $x$
      drop trigger if exists set_user_id_on_receipts on public.receipts;
      create trigger set_user_id_on_receipts before insert on public.receipts
      for each row execute procedure public.set_user_id();
    $x$;
  end if;
end$$;
