import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { WhatsAppService } from '../../../services/whatsappService.ts';
import { SMSService } from '../../../services/smsService.ts';
import { VoiceGenerator } from '../../../services/voiceGenerator.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const whatsapp = new WhatsAppService({
  accountSid: Deno.env.get('TWILIO_ACCOUNT_SID') || undefined,
  authToken: Deno.env.get('TWILIO_AUTH_TOKEN') || undefined,
  fromNumber: Deno.env.get('TWILIO_WHATSAPP_NUMBER') || undefined,
});
const sms = new SMSService({
  accountSid: Deno.env.get('TWILIO_ACCOUNT_SID') || undefined,
  authToken: Deno.env.get('TWILIO_AUTH_TOKEN') || undefined,
  fromNumber: Deno.env.get('TWILIO_SMS_NUMBER') || undefined,
});
const voice = new VoiceGenerator();

serve(async (req) => {
  const { reminderId } = await req.json();
  if (!reminderId) {
    return new Response(JSON.stringify({ error: 'reminderId is required' }), { status: 400 });
  }

  const rule = await getReminderRule(reminderId);
  if (!rule) {
    return new Response(JSON.stringify({ error: 'Reminder not found' }), { status: 404 });
  }

  const farmers = await getTargetFarmers(rule);
  const messageTemplate = rule.message_template || defaultTemplate(rule.type);

  for (const farmer of farmers) {
    const textMessage = personalizeTemplate(messageTemplate, farmer);
    let voiceUrl: string | undefined;
    let whatsappResult: { success: boolean } = { success: false };

    if (Deno.env.get('VOICE_TTS_ENDPOINT')) {
      voiceUrl = await voice.generateVoice(textMessage, farmer.language);
    }

    if (voiceUrl) {
      whatsappResult = await whatsapp.sendVoiceMessage(farmer.phone, voiceUrl, textMessage);
    } else {
      whatsappResult = await whatsapp.sendTextMessage(farmer.phone, textMessage);
    }

    if (!whatsappResult.success) {
      await sms.sendSMS(farmer.phone, textMessage);
    }

    await supabase.from('sent_messages').insert({
      group_id: farmer.group_id,
      farmer_id: farmer.id,
      reminder_rule_id: rule.id,
      type: 'reminder',
      channel: whatsappResult.success ? 'whatsapp' : 'sms',
      content: textMessage,
      voice_url: voiceUrl,
      status: whatsappResult.success ? 'sent' : 'failed',
    });
  }

  await supabase
    .from('reminder_rules')
    .update({ next_send_at: null })
    .eq('id', rule.id);

  return new Response(JSON.stringify({ status: 'ok', delivered: farmers.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function getReminderRule(id: string) {
  const { data, error } = await supabase
    .from('reminder_rules')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch reminder', error);
    return null;
  }

  return data;
}

async function getTargetFarmers(rule: any) {
  if (rule.farmer_id) {
    const { data } = await supabase
      .from('myagro_farmers')
      .select('*')
      .eq('id', rule.farmer_id)
      .maybeSingle();
    return data ? [data] : [];
  }

  const { data } = await supabase
    .from('myagro_farmers')
    .select('*')
    .eq('group_id', rule.group_id);

  return data || [];
}

function defaultTemplate(type: string) {
  switch (type) {
    case 'weekly_savings':
      return 'Bonjour {{name}}, pensez à économiser {{weekly_savings}} FCFA cette semaine pour {{package_type}}.';
    case 'payment_deadline':
      return 'Rappel: il reste {{amount_remaining}} FCFA avant l\'échéance du {{deadline}}.';
    case 'encouragement':
      return 'Bravo {{name}} ! Vous avez déjà économisé {{savings_progress}} FCFA.';
    default:
      return 'Message de votre VE pour {{name}}.';
  }
}

function personalizeTemplate(template: string, farmer: any) {
  const amountRemaining = Math.max(farmer.package_cost - farmer.savings_progress, 0).toLocaleString('fr-FR');
  const replacements: Record<string, string> = {
    '{{name}}': farmer.name,
    '{{package_type}}': farmer.package_type,
    '{{weekly_savings}}': farmer.weekly_savings_target.toLocaleString('fr-FR'),
    '{{savings_progress}}': farmer.savings_progress.toLocaleString('fr-FR'),
    '{{amount_remaining}}': amountRemaining,
    '{{deadline}}': new Date(farmer.payment_deadline).toLocaleDateString('fr-FR'),
  };

  return Object.entries(replacements).reduce((acc, [key, value]) => acc.replaceAll(key, value), template);
}
