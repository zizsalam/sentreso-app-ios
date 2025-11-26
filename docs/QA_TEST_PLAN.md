# Plan de tests QA – Sentreso x myAgro

## 1. Données nécessaires
- 1 compte VE (application)
- 2 groupes (`Groupe Pilote`, `Village Test`)
- 5 agricultrices par groupe
- 2 règles de rappel (hebdomadaire + deadline)

## 2. Tests fonctionnels
| ID | Fonction | Étapes | Résultat attendu |
|----|----------|--------|------------------|
| F1 | Création de groupe | App > Groupes > Créer | Groupe visible + RLS appliqué |
| F2 | Ajout agricultrice | Détail groupe > Ajouter | Agricultrice listée + champs corrects |
| F3 | Rappel manuel | Reminders > Nouveau > Hebdo | Rappel enregistré avec `next_send_at` |
| F4 | Historique messages | Envoyer rappel -> Messages | Carte avec statut `SENT` |
| F5 | Confirmation WhatsApp | Répondre "OK" | `farmer_confirmed = true` dans `sent_messages` |

## 3. Tests edge functions
1. `supabase functions invoke whatsapp-webhook --body '{"from":"whatsapp:+221...","message":"Combien ?"}'`
2. `supabase functions invoke execute-reminder --body '{"reminderId":"<uuid>"}'`
3. `supabase functions invoke reminder-scheduler`

Vérifier les logs et la table `sent_messages` à chaque étape.

## 4. Tests UI (VE)
- Basculer vers VE via paramètres → vérifier les nouveaux onglets.
- Groupes tab: tester rafraîchissement + modales.
- Reminders tab: créer/mettre en pause une règle.
- Messages tab: filtre WhatsApp/SMS et format `FCFA`.
- Analytics tab: section "Pilotage myAgro" affiche les bons chiffres.

## 5. Accessibilité & langue
- Tous les textes en français et montants en FCFA.
- Vérifier mode sombre (expo dev menu) pour s'assurer du contraste.

## 6. Checklist avant release
- [ ] Migrations exécutées (`db/supabase/migrations`)
- [ ] Edge functions déployées + secrets configurés
- [ ] Cron job actif (`cron.job` dans Supabase)
- [ ] Tests WhatsApp en bac à sable Twilio
- [ ] Dernier build Expo validé (Android/iOS)
