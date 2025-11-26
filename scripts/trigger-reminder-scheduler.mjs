import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_SERVICE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_KEY');
  process.exit(1);
}

const client = createClient(url, key);

const { data, error } = await client.functions.invoke('reminder-scheduler', { body: { source: 'manual' } });

if (error) {
  console.error('Scheduler failed', error);
  process.exit(1);
}

console.log('Scheduler response', data);
