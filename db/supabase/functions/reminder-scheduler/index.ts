import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const functionBase = `${supabaseUrl}/functions/v1`;

serve(async () => {
  const now = new Date().toISOString();
  const { data: dueRules, error } = await supabase
    .from('reminder_rules')
    .select('id, frequency, next_send_at')
    .eq('enabled', true)
    .lte('next_send_at', now);

  if (error) {
    console.error('Failed to fetch reminder rules', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  for (const rule of dueRules || []) {
    try {
      await fetch(`${functionBase}/execute-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ reminderId: rule.id }),
      });

      const nextSend = computeNextSendAt(rule.frequency, rule.next_send_at ?? now);
      if (nextSend) {
        await supabase
          .from('reminder_rules')
          .update({ next_send_at: nextSend.toISOString() })
          .eq('id', rule.id);
      }
    } catch (err) {
      console.error('Failed to trigger reminder', rule.id, err);
    }
  }

  return new Response(JSON.stringify({ processed: dueRules?.length || 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

function computeNextSendAt(frequency: string, lastSend: string) {
  const base = new Date(lastSend);
  switch (frequency) {
    case 'daily':
      base.setDate(base.getDate() + 1);
      return base;
    case 'weekly':
      base.setDate(base.getDate() + 7);
      return base;
    default:
      return null;
  }
}
