# 🚀 Guide de Déploiement - Sentreso Finance

## 📊 État Actuel
- **Version**: 1.1.0
- **Build iOS**: 91
- **Build Android**: 91
- **EAS Project ID**: 98d358f0-9c1a-4f1d-8df4-68c3da5e331d
- **Déploiement actuel**: Lien Expo externe

---

## 🎯 Stratégies de Déploiement Recommandées

### **Option 1 : Mises à jour OTA (Over-The-Air) - RECOMMANDÉ** ⭐

**Avantages:**
- ✅ Pas besoin de rebuild complet
- ✅ Mise à jour instantanée pour tous les utilisateurs
- ✅ Pas de re-téléchargement de l'app
- ✅ Idéal pour corrections de bugs et nouvelles fonctionnalités JS/UI

**Quand utiliser:**
- Corrections de bugs
- Nouvelles fonctionnalités UI/UX
- Améliorations de performance
- Changements de configuration

**Limitations:**
- ❌ Ne peut pas changer les dépendances natives
- ❌ Ne peut pas changer les permissions
- ❌ Ne peut pas changer le bundle identifier

#### Configuration OTA

1. **Activer les OTA Updates dans `app.json`:**

```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/98d358f0-9c1a-4f1d-8df4-68c3da5e331d"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

2. **Créer un nouveau build avec OTA activé:**

```bash
# Pour Android
eas build --platform android --profile production

# Pour iOS
eas build --platform ios --profile production
```

3. **Publier une mise à jour OTA:**

```bash
# Publier sur le channel "production"
eas update --branch production --message "Version 1.2.0 - Nouvelles fonctionnalités GIE"

# Ou publier sur un channel spécifique
eas update --branch staging --message "Version de test"
```

4. **Vérifier les mises à jour:**

```bash
# Lister les mises à jour publiées
eas update:list

# Voir les détails d'une mise à jour
eas update:view [UPDATE_ID]
```

---

### **Option 2 : Nouveau Build Complet (APK/IPA)**

**Quand utiliser:**
- Changements de dépendances natives
- Nouveaux plugins natifs
- Changements de permissions
- Changements majeurs de version (1.x → 2.0)

#### Étapes pour un nouveau build

1. **Incrémenter les versions dans `app.json`:**

```json
{
  "expo": {
    "version": "1.2.0",  // Version utilisateur visible
    "ios": {
      "buildNumber": "92"  // Incrémenter de 1
    },
    "android": {
      "versionCode": 92  // Incrémenter de 1
    }
  }
}
```

2. **Créer le build:**

```bash
# Build Android (APK pour distribution directe)
eas build --platform android --profile production

# Build iOS (pour TestFlight/App Store)
eas build --platform ios --profile production
```

3. **Télécharger et distribuer:**

```bash
# Télécharger le build
eas build:list
eas build:download [BUILD_ID]

# Pour Android: Uploader l'APK sur votre serveur ou Google Drive
# Pour iOS: Soumettre à TestFlight via eas submit
```

---

### **Option 3 : Déploiement Hybride (Recommandé pour le terrain)** 🎯

**Stratégie:**
1. Nouveau build complet pour les nouveaux utilisateurs
2. OTA updates pour les utilisateurs existants

#### Workflow

**Phase 1: Préparation**

```bash
# 1. Incrémenter la version
# Dans app.json: version "1.2.0", buildNumber 92, versionCode 92

# 2. Créer un nouveau build de base
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Phase 2: Distribution**

```bash
# 1. Distribuer le nouveau build aux nouveaux utilisateurs
# - Uploader APK sur serveur/Google Drive
# - Générer nouveau QR code pour flyers
# - Partager lien TestFlight pour iOS

# 2. Publier OTA pour les utilisateurs existants
eas update --branch production --message "Version 1.2.0"
```

**Phase 3: Communication**

- Informer les utilisateurs existants qu'une mise à jour est disponible
- Les nouveaux utilisateurs téléchargent directement la nouvelle version

---

## 📱 Configuration pour le Terrain

### **Android - Distribution Directe (APK)**

1. **Créer un profil de build pour APK:**

Dans `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "apk-direct": {
      "android": {
        "buildType": "apk",
        "distribution": "internal"
      }
    }
  }
}
```

2. **Build et télécharger:**

```bash
eas build --platform android --profile apk-direct
```

3. **Héberger l'APK:**

Options:
- **Google Drive** (gratuit, facile)
- **Firebase Hosting** (gratuit, rapide)
- **Votre propre serveur**
- **GitHub Releases**

4. **Créer un QR code vers l'APK:**

```bash
# Utiliser un service comme qr-code-generator.com
# URL: https://drive.google.com/uc?export=download&id=[FILE_ID]
```

### **iOS - TestFlight**

1. **Build et soumettre:**

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

2. **Partager le lien TestFlight:**

```
https://testflight.apple.com/join/[CODE]
```

---

## 🔄 Gestion des Versions

### **Système de Versioning Recommandé**

Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.x.x): Changements majeurs, breaking changes
- **MINOR** (x.1.x): Nouvelles fonctionnalités, compatibilité arrière
- **PATCH** (x.x.1): Corrections de bugs, petites améliorations

### **Exemple de Cycle**

```
1.1.0 → 1.1.1 (OTA) - Correction bug
1.1.1 → 1.2.0 (Build + OTA) - Nouvelles fonctionnalités GIE
1.2.0 → 1.2.1 (OTA) - Amélioration UX
1.2.1 → 2.0.0 (Build) - Refonte majeure
```

---

## 🛠️ Checklist de Déploiement

### **Avant chaque déploiement**

- [ ] Tester sur Android (appareil réel)
- [ ] Tester sur iOS (appareil réel si possible)
- [ ] Vérifier les migrations de base de données
- [ ] Vérifier la compatibilité avec les anciennes versions
- [ ] Documenter les changements (CHANGELOG.md)
- [ ] Incrémenter les versions dans `app.json`

### **Pour OTA Updates**

- [ ] Vérifier que `expo-updates` est installé
- [ ] Tester la mise à jour sur un appareil de test
- [ ] Vérifier que le `runtimeVersion` est correct
- [ ] Publier sur le bon channel (`production` ou `staging`)

### **Pour Nouveau Build**

- [ ] Créer le build avec EAS
- [ ] Télécharger et tester l'APK/IPA
- [ ] Uploader sur votre serveur de distribution
- [ ] Générer nouveau QR code si nécessaire
- [ ] Mettre à jour la documentation de déploiement

---

## 📋 Scripts Utiles

### **Script de déploiement rapide**

Créer `scripts/deploy.sh`:

```bash
#!/bin/bash

# Configuration
VERSION=$1
MESSAGE=$2

if [ -z "$VERSION" ] || [ -z "$MESSAGE" ]; then
  echo "Usage: ./scripts/deploy.sh <version> <message>"
  echo "Example: ./scripts/deploy.sh 1.2.0 'Nouvelles fonctionnalités GIE'"
  exit 1
fi

# 1. Mettre à jour app.json
echo "📝 Mise à jour de la version..."
node -e "
const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const [major, minor, patch] = '$VERSION'.split('.');
appJson.expo.version = '$VERSION';
appJson.expo.ios.buildNumber = String(parseInt(appJson.expo.ios.buildNumber) + 1);
appJson.expo.android.versionCode = parseInt(appJson.expo.android.versionCode) + 1;
fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
"

# 2. Publier OTA update
echo "🚀 Publication OTA..."
eas update --branch production --message "$MESSAGE"

# 3. Optionnel: Créer un nouveau build
read -p "Créer un nouveau build complet? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📦 Création du build Android..."
  eas build --platform android --profile production

  echo "📦 Création du build iOS..."
  eas build --platform ios --profile production
fi

echo "✅ Déploiement terminé!"
```

### **Vérifier les versions déployées**

```bash
# Lister les builds
eas build:list

# Lister les updates OTA
eas update:list

# Voir les utilisateurs sur chaque version
# (nécessite analytics ou tracking custom)
```

---

## 🚨 Gestion des Problèmes

### **Rollback d'une mise à jour OTA**

```bash
# Annuler la dernière mise à jour
eas update:republish --branch production --message "Rollback version précédente"
```

### **Forcer une mise à jour**

Si les utilisateurs ne reçoivent pas la mise à jour:

1. Vérifier le `runtimeVersion` dans `app.json`
2. S'assurer que le build de base supporte les OTA
3. Publier une nouvelle mise à jour avec un message clair

### **Migration de données**

Si vous changez le schéma de base de données:

1. Créer une migration Supabase
2. Tester la migration sur staging
3. Déployer la migration AVANT la mise à jour de l'app
4. S'assurer que l'app gère les anciennes et nouvelles versions

---

## 📞 Support Utilisateurs

### **Communication avant déploiement**

- WhatsApp/SMS aux utilisateurs clés
- Message dans l'app (si possible)
- Documentation des changements

### **Support après déploiement**

- Numéro de support pour problèmes
- Groupe WhatsApp pour feedback
- Email pour bugs critiques

---

## 💡 Recommandations Finales

1. **Pour le terrain Sénégalais:**
   - Privilégier les APK directs (pas de Play Store requis)
   - Utiliser OTA pour les mises à jour fréquentes
   - Avoir un plan B (build précédent) en cas de problème

2. **Versioning:**
   - Toujours incrémenter les build numbers
   - Documenter chaque version dans CHANGELOG.md
   - Tester sur appareils réels avant déploiement

3. **Monitoring:**
   - Suivre les erreurs avec Sentry (optionnel)
   - Analyser l'adoption des nouvelles versions
   - Collecter le feedback utilisateur

4. **Sécurité:**
   - Ne jamais partager les clés de build
   - Utiliser des channels séparés (staging/production)
   - Valider les mises à jour avant publication

---

## 🔗 Ressources

- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Updates API](https://docs.expo.dev/versions/latest/sdk/updates/)

---

**Dernière mise à jour:** 2025-11-06


