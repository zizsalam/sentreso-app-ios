import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { WhatsAppService } from '../../../services/whatsappService.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const whatsapp = new WhatsAppService({
  accountSid: Deno.env.get('TWILIO_ACCOUNT_SID') || undefined,
  authToken: Deno.env.get('TWILIO_AUTH_TOKEN') || undefined,
  fromNumber: Deno.env.get('TWILIO_WHATSAPP_NUMBER') || undefined,
});

serve(async (req) => {
  if (req.method === 'GET') {
    return new Response('OK', { status: 200 });
  }

  const payload = await req.json().catch(() => ({}));
  const from = payload.from || payload?.messages?.[0]?.from;
  const message = payload.message || payload?.messages?.[0]?.text?.body || '';

  if (!from) {
    return new Response(JSON.stringify({ error: 'Missing sender' }), { status: 400 });
  }

  const farmer = await getFarmerByPhone(from);
  const intent = understandIntent(message);
  const responseText = generateResponse(intent, farmer);

  if (responseText) {
    await whatsapp.sendTextMessage(from.startsWith('whatsapp:') ? from : `whatsapp:${from}`, responseText);
  }

  if (intent === 'confirm_receipt' && payload.messageId) {
    await supabase
      .from('sent_messages')
      .update({ farmer_confirmed: true, confirmation_method: 'whatsapp_reply', confirmed_at: new Date().toISOString() })
      .eq('id', payload.messageId);
  }

  return new Response(JSON.stringify({ status: 'received', intent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function getFarmerByPhone(phone: string) {
  const normalized = phone.replace('whatsapp:', '');
  const { data, error } = await supabase
    .from('myagro_farmers')
    .select('*')
    .eq('phone', normalized)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch farmer', error);
    return null;
  }

  return data;
}

const INTENT_KEYWORDS = {
  check_balance: ['solde', 'reste', 'combien', 'amount', 'balance'],
  check_deadline: ['date', 'deadline', 'échéance', 'quand', 'due'],
  confirm_receipt: ['ok', 'bien reçu', 'reçu', 'merci'],
  greeting: ['bonjour', 'salaam', 'hello'],
};

function understandIntent(message: string) {
  const normalized = (message || '').toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((word) => normalized.includes(word))) {
      return intent as keyof typeof INTENT_KEYWORDS;
    }
  }
  return 'unknown';
}

function generateResponse(intent: string, farmer: any) {
  if (!farmer) {
    return "Nous n'avons pas trouvé votre dossier. Contactez votre VE.";
  }

  switch (intent) {
    case 'check_balance': {
      const remaining = Math.max(farmer.package_cost - farmer.savings_progress, 0);
      return `Il vous reste ${remaining} FCFA à payer pour votre paquet ${farmer.package_type}.`;}
    case 'check_deadline': {
      const deadline = new Date(farmer.payment_deadline).toLocaleDateString('fr-FR');
      return `La date limite pour votre paquet est le ${deadline}.`;
    }
    case 'confirm_receipt':
      return 'Merci pour la confirmation. Continuez vos économies !';
    case 'greeting':
      return 'Bonjour ! Comment pouvons-nous vous aider ?';
    default:
      return 'Merci pour votre message. Votre VE vous répondra bientôt.';
  }
}
