# WhatsApp & Voice Infrastructure

## 1. Environment Variables
Set the following in Supabase → Edge Functions → Secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER` (format: `+1415...`)
- `TWILIO_SMS_NUMBER`
- `VOICE_TTS_ENDPOINT` (optional)
- `VOICE_TTS_API_KEY` (optional)
- `VOICE_TEMPLATE_BASE_URL` (optional)

## 2. Twilio Sandbox Setup
1. Create a WhatsApp sender in Twilio Console.
2. Verify the sandbox phone number and join code.
3. Add the webhook URL after deploying `whatsapp-webhook`:
   ```
   https://<project>.supabase.co/functions/v1/whatsapp-webhook
   ```
4. Allow `POST` requests and choose JSON payloads.

## 3. Deploy Functions
```bash
supabase functions deploy whatsapp-webhook
supabase functions deploy execute-reminder
```

## 4. Testing Checklist
- [ ] Send "Bonjour" via WhatsApp → receive greeting
- [ ] Ask "Combien je dois ?" → receive balance details
- [ ] Reply "OK" → message marked confirmed in `sent_messages`
- [ ] Trigger `execute-reminder` manually using Supabase dashboard with `{ "reminderId": "..." }`

## 5. Webhook Payload Samples
Store sample payloads in `docs/webhook-samples/` for future regression tests. Use `ngrok` or Twilio console to capture JSON bodies.
