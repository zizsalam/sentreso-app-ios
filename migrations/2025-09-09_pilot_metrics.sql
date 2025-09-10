-- ===========================
-- Sentreso Pilot Metrics Views (idempotent)
-- ===========================

-- Some projects don't yet have all tables/columns.
-- These DO blocks guard against missing objects so the migration is safe to re-run.

-- A. "Active today" view (transactions in last 24h)
do $$
begin
  if to_regclass('public.transactions') is not null then
    execute $v$
      create or replace view public.ops_active_today as
      select user_id, count(*) as tx_today
      from public.transactions
      where created_at::date = now()::date
      group by user_id
      order by tx_today desc;
    $v$;
  end if;
end$$;

-- B. Activity last 7 days (counts + sums)
do $$
begin
  if to_regclass('public.transactions') is not null then
    execute $v$
      create or replace view public.ops_activity_7d as
      select
        user_id,
        count(*)                                                   as tx_count,
        sum(case when "type"='income'  then amount else 0 end)    as income_sum,
        sum(case when "type"='expense' then amount else 0 end)    as expense_sum,
        min(created_at)                                           as first_tx,
        max(created_at)                                           as last_tx
      from public.transactions
      where created_at >= now() - interval '7 days'
      group by user_id
      order by last_tx desc;
    $v$;
  end if;
end$$;

-- C. Daily active merchants (>=1 transaction per day)
do $$
begin
  if to_regclass('public.transactions') is not null then
    execute $v$
      create or replace view public.metrics_daily_active as
      select
        date_trunc('day', created_at)::date as day,
        count(distinct user_id)              as active_merchants
      from public.transactions
      group by 1
      order by 1 desc;
    $v$;
  end if;
end$$;

-- D. Daily onboarded merchants (first-seen in customers table)
-- Fallback to created_at if no dedicated "first_seen" exists.
do $$
begin
  if to_regclass('public.customers') is not null then
    -- detect the timestamp column to use
    -- preference order: first_seen, created_at, updated_at
    if exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='customers' and column_name='first_seen') then
      execute $v$
        create or replace view public.metrics_daily_onboarded as
        with firsts as (
          select user_id, min(first_seen) as first_ts
          from public.customers
          group by user_id
        )
        select first_ts::date as day, count(*) as merchants_onboarded
        from firsts
        group by 1
        order by 1 desc;
      $v$;
    elsif exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='customers' and column_name='created_at') then
      execute $v$
        create or replace view public.metrics_daily_onboarded as
        with firsts as (
          select user_id, min(created_at) as first_ts
          from public.customers
          group by user_id
        )
        select first_ts::date as day, count(*) as merchants_onboarded
        from firsts
        group by 1
        order by 1 desc;
      $v$;
    elsif exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='customers' and column_name='updated_at') then
      execute $v$
        create or replace view public.metrics_daily_onboarded as
        with firsts as (
          select user_id, min(updated_at) as first_ts
          from public.customers
          group by user_id
        )
        select first_ts::date as day, count(*) as merchants_onboarded
        from firsts
        group by 1
        order by 1 desc;
      $v$;
    end if;
  end if;
end$$;

-- E. Distributor productivity (if you record who onboarded a merchant)
-- Assumes a column customers.created_by (UUID of distributor/agent). If absent, this step is skipped.
do $$
begin
  if to_regclass('public.customers') is not null
     and exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='customers' and column_name='created_by') then
    execute $v$
      create or replace view public.metrics_distributor as
      select created_by as distributor_id, count(*) as merchants_added
      from public.customers
      group by created_by
      order by merchants_added desc;
    $v$;
  end if;
end$$;

-- F. Helpful indexes (safe to create if not exists)
create index if not exists idx_transactions_created_at on public.transactions(created_at);
create index if not exists idx_transactions_user_id    on public.transactions(user_id);
create index if not exists idx_customers_user_id       on public.customers(user_id);
