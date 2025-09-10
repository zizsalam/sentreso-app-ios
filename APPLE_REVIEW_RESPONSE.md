# Réponse à l'équipe de vérification Apple

## Version 1.0.0 (Build 28) - Corrections apportées

### Problème 1 : Numéro de téléphone obligatoire
**Correction apportée :**
- Le numéro de téléphone est maintenant **optionnel** dans l'écran de connexion
- Seul le nom complet reste obligatoire
- Validation du téléphone uniquement si fourni
- Placeholder mis à jour : "Numéro de téléphone (optionnel)"

**Fichiers modifiés :**
- `app/login.tsx` : Logique de validation mise à jour
- `app.json` : Build number incrémenté à 28

### Problème 2 : App Tracking Transparency
**Correction apportée :**
- Ajout de `NSUserTrackingUsageDescription` dans `app.json`
- Description : "Cette application peut demander l'autorisation de suivre votre activité pour améliorer votre expérience et personnaliser le contenu."

**Note importante :**
Notre application ne fait actuellement **PAS** de tracking utilisateur. Les informations de confidentialité dans App Store Connect doivent être mises à jour pour refléter cela.

### Informations de confidentialité à corriger dans App Store Connect :
Veuillez mettre à jour les informations de confidentialité pour indiquer que l'app **NE COLLECTE PAS** les données suivantes :
- ❌ Physical Address
- ❌ Email Address
- ❌ Phone Number
- ❌ Audio Data
- ❌ Other Contact Info
- ❌ Name
- ❌ Photos or Videos
- ❌ Other Financial Info

### Fonctionnalités de l'app :
- ✅ Gestion des transactions financières
- ✅ Enregistrement vocal local (pas de tracking)
- ✅ Stockage local des données utilisateur
- ✅ Pas de partage de données avec des tiers

### Test de l'app :
1. Ouvrez l'app
2. Sur l'écran de connexion, vous pouvez maintenant :
   - Entrer seulement le nom (obligatoire)
   - Laisser le téléphone vide (optionnel)
   - Continuer sans numéro de téléphone
3. L'app fonctionne normalement sans téléphone

**L'app est maintenant conforme aux guidelines Apple 5.1.1 et 5.1.2.**
