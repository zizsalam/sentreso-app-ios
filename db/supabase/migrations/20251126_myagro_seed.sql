-- Seed sample data for QA preview
-- Replace ve_id with an actual VE UUID when applying in real environments
INSERT INTO myagro_groups (id, ve_id, name, village, language)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Groupe Pilote', 'Ngohé', 'wolof')
ON CONFLICT (id) DO NOTHING;

INSERT INTO myagro_farmers (id, group_id, name, phone, package_type, package_cost, payment_deadline, weekly_savings_target, language, savings_progress, payment_status)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Aissatou Diallo', '+221771234567', 'poultry', 25000, NOW() + INTERVAL '30 days', 2000, 'wolof', 8000, 'on_track')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reminder_rules (id, group_id, farmer_id, type, frequency, days_before_deadline, enabled, language, next_send_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', NULL, 'weekly_savings', 'weekly', NULL, true, 'wolof', NOW() + INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
