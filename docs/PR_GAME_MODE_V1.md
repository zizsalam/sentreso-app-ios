# Game Mode v1 – **DB Migration Only** (Safe & Additive)

**Goal:** Add tables & policies for Game Mode (transactions, game_state, leaderboard_daily, optional profiles) with strict RLS.
**Safety:** 100% **additive + idempotent**. No drops/renames/type changes. Single transaction.

### What’s included

* Tables: `transactions`, `game_state`, `leaderboard_daily` (+ `profiles` only if neither `users` nor `profiles` exists)
* FKs: Prefer `public.users(id)` → else `public.profiles(user_id)` (auto-creates `profiles` if needed)
* RLS: owner-only on `transactions`/`game_state`; read-only for `leaderboard_daily` (authenticated)
* Helper: `public.local_date_dakar(ts timestamptz)`
* Trigger: `game_state.updated_at` auto-refresh
* Indexes: `transactions(user_id, occurred_at desc)`; `leaderboard(market, snapshot_date)`
* Files:

  * `supabase/migrations/20250924_game_mode_v1.sql`
  * `db/snapshots/before_game_mode.sql`
  * `db/snapshots/after_game_mode.sql`

---

## Apply plan (staging-first)

> **Never** apply directly to prod.

1. **Pre-flight snapshot**

```bash
supabase db dump --local -f db/snapshots/before_game_mode.sql
```

2. **Apply on staging**

```bash
# ensure STAGING env is selected (PG connection set in your CI or .env)
supabase db push
```

3. **Post snapshot**

```bash
supabase db dump --local -f db/snapshots/after_game_mode.sql
```

4. **Idempotency sanity**

```bash
# Run the same migration file again (should be a no-op)
psql "$STAGING_PG_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20250924_game_mode_v1.sql
```

---

## Smoke checks (psql)

**Objects exist**

```sql
-- tables
select table_name from information_schema.tables
where table_schema='public'
  and table_name in ('transactions','game_state','leaderboard_daily','profiles');

-- helper
select proname from pg_proc where pronamespace = 'public'::regnamespace and proname='local_date_dakar';

-- policies
select policyname, tablename from pg_policies
where schemaname='public' and tablename in ('transactions','game_state','leaderboard_daily');

-- FKs chosen correctly
select conname, conrelid::regclass as table, confrelid::regclass as ref_table
from pg_constraint
where contype='f' and conname in ('transactions_user_fk','game_state_user_fk');
```

**RLS is ON**

```sql
select relname, relrowsecurity from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and relname in ('transactions','game_state','leaderboard_daily');
```

**RLS behavior (quick):**

> In Supabase, simulate a user context:

```sql
-- user A
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000aa"}';

insert into public.transactions (user_id, kind, amount_cfa, occurred_at)
values ('00000000-0000-0000-0000-0000000000aa','sale',1000, now());

-- user B (should NOT see A’s row)
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000bb"}';
select * from public.transactions;  -- expect 0 rows

-- switch back to A (should see 1 row)
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000aa"}';
select count(*) from public.transactions; -- expect 1
```

---

## CI (optional) – quick dry-run job

If you don’t use Supabase local in CI, stub `auth.users` so the migration can run:

```yaml
name: db-migration-dry-run
on: [pull_request]
jobs:
  dry-run:
    runs-on: ubuntu-latest
    services:
      pg:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=5s
          --health-timeout=5s
          --health-retries=10
    steps:
      - uses: actions/checkout@v4
      - name: Wait for Postgres
        run: |
          for i in {1..30}; do
            pg_isready -h localhost -p 5432 -U postgres && break
            sleep 1
          done
      - name: Prepare stub auth schema (for local only)
        run: |
          psql postgresql://postgres:postgres@localhost:5432/postgres \
            -v ON_ERROR_STOP=1 -c "create schema if not exists auth; create table if not exists auth.users (id uuid primary key);"
      - name: Apply migration twice (idempotency)
        run: |
          psql postgresql://postgres:postgres@localhost:5432/postgres -v ON_ERROR_STOP=1 \
            -f supabase/migrations/20250924_game_mode_v1.sql
          psql postgresql://postgres:postgres@localhost:5432/postgres -v ON_ERROR_STOP=1 \
            -f supabase/migrations/20250924_game_mode_v1.sql
```

---

## Rollback

* **No destructive rollback required** (additive only).
* If any app-side issue, **disable feature flags** consuming these tables.
* Keep the schema in place (safe for future use).

---

## Acceptance

* Migration runs clean on empty DB & existing DB (with either `users` or `profiles`).
* Re-running is a no-op (idempotent).
* RLS prevents cross-user reads/writes; leaderboard is read-only to `authenticated`.
* FK target correctly selected per detection rules.
