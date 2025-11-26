import { createClient } from '@supabase/supabase-js';

const TEST_URL = process.env.SUPABASE_TEST_URL;
const SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_KEY;

if (!TEST_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_TEST_URL or SUPABASE_TEST_SERVICE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(TEST_URL, SERVICE_KEY);

async function main() {
  const sampleVeId = '12345678-1234-1234-1234-123456789012';

  const { data: group, error: groupError } = await supabase
    .from('myagro_groups')
    .insert({
      ve_id: sampleVeId,
      name: 'Test Smoke Group',
      village: 'Thiès',
      language: 'wolof',
    })
    .select()
    .single();

  if (groupError) throw groupError;

  const { error: farmerError } = await supabase
    .from('myagro_farmers')
    .insert({
      group_id: group.id,
      name: 'Test Farmer',
      phone: '+221700000001',
      package_type: 'seed',
      package_cost: 20000,
      payment_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      weekly_savings_target: 2000,
      language: 'wolof',
    });

  if (farmerError) throw farmerError;

  const { error: reminderError } = await supabase
    .from('reminder_rules')
    .insert({
      group_id: group.id,
      type: 'weekly_savings',
      frequency: 'weekly',
      enabled: true,
      language: 'wolof',
    });

  if (reminderError) throw reminderError;

  console.log('Smoke test passed ✅');
}

main().catch((err) => {
  console.error('Smoke test failed', err);
  process.exit(1);
});
