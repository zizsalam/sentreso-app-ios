# Automatisation des rappels

## 1. Déploiement des Edge Functions
```bash
supabase functions deploy whatsapp-webhook
supabase functions deploy execute-reminder
supabase functions deploy reminder-scheduler
```

Exporter les secrets suivants (ou via le dashboard Supabase):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
- `TWILIO_SMS_NUMBER`
- `VOICE_TTS_ENDPOINT` / `VOICE_TTS_API_KEY` (facultatif)

## 2. Planification pg_cron
Exécuter dans l'éditeur SQL Supabase:
```sql
select cron.schedule(
  'myagro-reminders-every-30min',
  '*/30 * * * *',
  $$
  select
    net.http_post(
      url := 'https://<project>.supabase.co/functions/v1/reminder-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('source', 'cron')
    );
  $$
);
```

> Remplacer `<project>` par l'identifiant Supabase et définir `app.settings.service_role_key` via `alter database` si nécessaire.

## 3. Flux de bout en bout
1. Les VEs créent un rappel via l'application → `reminder_rules.next_send_at` mis à jour.
2. `reminder-scheduler` tourne toutes les 30 minutes, détecte les règles arrivées à échéance et appelle `execute-reminder`.
3. `execute-reminder` génère le message, tente WhatsApp (voix + texte) puis SMS fallback, enregistre dans `sent_messages`.
4. Les réponses WhatsApp passent par `whatsapp-webhook`, ce qui alimente `sent_messages.farmer_confirmed` et déclenche une réponse IA.

## 4. Tests recommandés
- Créer une règle avec `next_send_at` dans les 5 prochaines minutes, déclencher manuellement `reminder-scheduler` via `supabase functions invoke`.
- Vérifier `sent_messages` et l'onglet `Messages` côté application.
- Répondre "OK" au message pour confirmer la mise à jour de l'état.
