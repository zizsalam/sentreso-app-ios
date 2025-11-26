# Checklist de déploiement – Sentreso x myAgro

## Avant migration
- [ ] Sauvegarde base Supabase (dump ou snapshot)
- [ ] Variables d'environnement vérifiées (Twilio, TTS, etc.)

## Migrations & schéma
- [ ] Appliquer les migrations `db/supabase/migrations/*myagro*`
- [ ] Vérifier l'existence des tables `myagro_groups`, `myagro_farmers`, `reminder_rules`, `sent_messages`
- [ ] RLS activé et testé pour un compte VE

## Edge Functions
- [ ] `whatsapp-webhook` déployée
- [ ] `execute-reminder` déployée
- [ ] `reminder-scheduler` déployée
- [ ] Secrets Supabase configurés (voir `docs/MYAGRO_WHATSAPP_SETUP.md` et `docs/REMINDER_AUTOMATION.md`)

## Cron & automatisation
- [ ] Job `myagro-reminders-every-30min` créé dans `cron.job`
- [ ] Test manuel de `reminder-scheduler` (via dashboard ou CLI)

## Application mobile
- [ ] Build Expo Android (EAS) testé
- [ ] Build Expo iOS (TestFlight) testé
- [ ] Basculer en VE → onglets `Groupes`, `Rappels`, `Messages`, `Stats` visibles
- [ ] Toutes les chaînes en français, montants en FCFA (aucun symbole `$`)

## WhatsApp
- [ ] Numéro sandbox/production validé chez Twilio
- [ ] Webhook Twilio → `whatsapp-webhook` configuré
- [ ] Scénarios testés : salutations, question sur le solde, confirmation "OK"

## Monitoring & rollback
- [ ] Logs Edge Functions surveillés (erreurs Twilio/SMS/TTS)
- [ ] Plan de rollback : désactiver cron + revenir au schéma précédent si besoin
