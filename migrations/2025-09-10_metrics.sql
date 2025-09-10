-- ===========================
-- Sentreso Pilot Metrics (Fail-loud)
-- ===========================

-- A) Ops: Active today (>= 1 transaction today)
drop view if exists public.ops_active_today cascade;
create view public.ops_active_today as
select
  user_id,
  count(*) as tx_today
from public.transactions
where created_at::date = now()::date
group by user_id
order by tx_today desc;

-- B) Ops: Activity last 7 days per user (counts + sums)
drop view if exists public.ops_activity_7d cascade;
create view public.ops_activity_7d as
select
  user_id,
  count(*)                                                   as tx_count,
  sum(case when "type" = 'income'  then amount else 0 end)  as income_sum,
  sum(case when "type" = 'expense' then amount else 0 end)  as expense_sum,
  min(created_at)                                           as first_tx,
  max(created_at)                                           as last_tx
from public.transactions
where created_at >= now() - interval '7 days'
group by user_id
order by last_tx desc nulls last;

-- C) Metrics: Daily active merchants (>= 1 tx / day)
drop view if exists public.metrics_daily_active cascade;
create view public.metrics_daily_active as
select
  date_trunc('day', created_at)::date as day,
  count(distinct user_id)              as active_merchants
from public.transactions
group by 1
order by 1 desc;

-- D) Metrics: Daily onboarded merchants (first seen in customers)
-- Uses customers.created_at as "first_seen".
drop view if exists public.metrics_daily_onboarded cascade;
create view public.metrics_daily_onboarded as
with firsts as (
  select user_id, min(created_at) as first_ts
  from public.customers
  group by user_id
)
select
  first_ts::date as day,
  count(*)       as merchants_onboarded
from firsts
group by 1
order by 1 desc;

-- E) Metrics: Distributor productivity (requires customers.created_by)
-- If you don't have created_by yet, comment this block out or add the column.
drop view if exists public.metrics_distributor cascade;
create view public.metrics_distributor as
select
  created_by as distributor_id,
  count(*)   as merchants_added
from public.customers
group by created_by
order by merchants_added desc;

-- F) Helpful indexes for metrics performance
create index if not exists idx_transactions_created_at on public.transactions(created_at);
create index if not exists idx_transactions_user_id    on public.transactions(user_id);
create index if not exists idx_customers_created_at    on public.customers(created_at);
create index if not exists idx_customers_user_id       on public.customers(user_id);
create index if not exists idx_customers_created_by    on public.customers(created_by);

-- After running: quick acceptance checks
-- Should return rows if you have any transactions today
-- select * from public.ops_active_today limit 10;

-- 7-day activity per user
-- select * from public.ops_activity_7d limit 10;

-- Daily active line series
-- select * from public.metrics_daily_active order by day desc limit 14;

-- Daily onboarded merchants
-- select * from public.metrics_daily_onboarded order by day desc limit 14;

-- Distributor productivity (only if created_by exists)
-- select * from public.metrics_distributor limit 20;

-- If something errors
-- created_at missing on transactions or customers → replace with your actual timestamp column in all four view definitions.
-- created_by missing on customers → either add the column or comment out the metrics_distributor block.
-- Type is not exactly 'income'/'expense' → adjust the CASE in ops_activity_7d.
