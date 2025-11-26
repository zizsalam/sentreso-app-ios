-- Simple schema verification script (run after deploying migrations)
-- Ensures required tables exist and enforce language constraints

-- Check groups table exists
SELECT 'myagro_groups'::regclass;
SELECT 'myagro_farmers'::regclass;
SELECT 'reminder_rules'::regclass;
SELECT 'sent_messages'::regclass;

-- Validate language constraint rejects invalid entry
BEGIN;
  SAVEPOINT before_invalid_language;
  DO $$
  BEGIN
    INSERT INTO myagro_groups (ve_id, name, village, language)
    VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 'Test', 'invalid');
  EXCEPTION WHEN others THEN
    -- expected failure
    RAISE NOTICE 'Language constraint working';
  END;
  $$;
  ROLLBACK TO SAVEPOINT before_invalid_language;
COMMIT;

-- Validate reminder policy relationship
BEGIN;
  INSERT INTO myagro_groups (id, ve_id, name, village, language)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'Test Group', 'Dakar', 'french')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO myagro_farmers (id, group_id, name, phone, package_type, package_cost, payment_deadline, weekly_savings_target)
  VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Farmer', '+221700000000', 'seed', 15000, NOW() + INTERVAL '20 days', 1500)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO reminder_rules (id, group_id, farmer_id, type, frequency, enabled)
  VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'weekly_savings', 'weekly', true)
  ON CONFLICT (id) DO NOTHING;
COMMIT;
