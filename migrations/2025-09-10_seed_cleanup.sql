-- ===========================
-- Sentreso Pilot Seed Cleanup (safe)
-- Removes only rows created by the 2025-09-10 seed
-- ===========================

-- Delete seeded transactions
delete from public.transactions
where user_id in (
  '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-0000000000b1'
);

-- Delete seeded customers
delete from public.customers
where user_id in (
  '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-0000000000b1'
);

-- Delete seeded auth users (if allowed)
delete from auth.users
where id in (
  '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-0000000000b1'
);
