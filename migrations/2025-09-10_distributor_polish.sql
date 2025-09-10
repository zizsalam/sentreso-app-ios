-- ===========================
-- Distributor metrics polish: readable view, guardrails, agent claim
-- Safe to re-run
-- ===========================

-- 1) Human-readable distributor view (join auth.users)
drop view if exists public.metrics_distributor cascade;
create view public.metrics_distributor as
select
  c.created_by              as distributor_id,
  u.email                   as distributor_email,
  count(*)                  as merchants_added
from public.customers c
left join auth.users u on u.id = c.created_by
where c.created_by is not null
group by c.created_by, u.email
order by merchants_added desc;

-- 2) Guardrails
-- 2A) Keep created_by tied to real users (FK, idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customers_created_by_fk'
  ) then
    alter table public.customers
      add constraint customers_created_by_fk
      foreign key (created_by) references auth.users(id) on delete set null;
  end if;
end$$;

-- 2B) Prevent overwriting created_by after initial set
create or replace function public.prevent_created_by_overwrite()
returns trigger language plpgsql as $$
begin
  if old.created_by is not null and new.created_by is distinct from old.created_by then
    raise exception 'created_by is immutable once set';
  end if;
  return new;
end$$;

drop trigger if exists lock_created_by_change on public.customers;
create trigger lock_created_by_change
  before update of created_by on public.customers
  for each row
  execute procedure public.prevent_created_by_overwrite();

-- 3) Agent policies: read onboarded, one-time claim of user_id
drop policy if exists customers_agent_select on public.customers;
create policy customers_agent_select
  on public.customers for select
  using (auth.uid() = created_by);

drop policy if exists customers_agent_claim on public.customers;
create policy customers_agent_claim
  on public.customers for update
  using (auth.uid() = created_by AND user_id is null)
  with check (auth.uid() = created_by AND user_id is not null);
