-- ===========================
-- Acceptance checks for distributor metrics
-- ===========================

-- Confirm columns
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='customers'
  and column_name in ('user_id','created_by','created_at');

-- Triggers present
select tgname, tgrelid::regclass as table_name, tgfoid::regprocedure as trigger_fn
from pg_trigger
where not tgisinternal and tgrelid = 'public.customers'::regclass;

-- Policies
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename='customers'
order by policyname, cmd;

-- View works (will be empty until you insert some rows)
select * from public.metrics_distributor limit 10;
