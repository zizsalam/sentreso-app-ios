-- ===========================
-- Sentreso Pilot Seed Data
-- ===========================

-- Fake user UUIDs (use random ones, not tied to real auth.users)
-- Replace with real auth.users.id if you want to join real accounts.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-0000000000a1', 'merchantA@test.com', '{"seed":true}'),
  ('00000000-0000-0000-0000-0000000000b1', 'merchantB@test.com', '{"seed":true}')
on conflict (id) do nothing;

-- Seed customers (simulate distributor onboarding)
insert into public.customers (id, user_id, name, created_at, updated_at)
values
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000000a1', 'Merchant A', now() - interval '3 days', now() - interval '3 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000000b1', 'Merchant B', now() - interval '1 days', now() - interval '1 days')
on conflict do nothing;

-- Seed transactions for Merchant A
insert into public.transactions (id, user_id, type, category, amount, description, created_at, updated_at)
values
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000000a1', 'income',  'divers', 1000, 'Sale A1', now() - interval '2 days', now() - interval '2 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000000a1', 'expense', 'divers',  300, 'Purchase A2', now() - interval '1 days', now() - interval '1 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000000a1', 'income',  'divers',  500, 'Sale A3', now(), now());

-- Seed transactions for Merchant B
insert into public.transactions (id, user_id, type, category, amount, description, created_at, updated_at)
values
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000000b1', 'income',  'divers',  700, 'Sale B1', now() - interval '1 days', now() - interval '1 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000000b1', 'expense', 'divers',  200, 'Expense B2', now(), now());
