# 📋 Changelog - Sentreso Finance

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.2.0] - 2025-11-06 (À venir)

### ✨ Ajouté
- Fonctionnalités GIE (Groupements d'Intérêt Économique)
  - Gestion des membres avec photos/avatars
  - Activités rapides (Cotisation, Remboursement, Prêt, etc.)
  - Écran de réunion avec totaux quotidiens
  - Export PDF/CSV/WhatsApp pour les réunions
  - Sélection de membres pour les transactions
- Modal de changement de profil (Merchant ↔ GIE)
- Suppression de transactions avec confirmation
- Recherche et tri des membres
- Édition/suppression de membres
- Sélection de date pour voir les réunions passées
- Informations GIE éditables (nom, adresse, téléphone, email)

### 🔧 Modifié
- Amélioration de la persistance de session (moins de déconnexions automatiques)
- Interface conditionnelle selon le type d'utilisateur (Merchant/GIE)
- PDF de réunion formaté professionnellement avec détails GIE

### 🗑️ Supprimé
- Fonctionnalité leaderboard (non pertinente pour le contexte)

### 🔒 Sécurité
- Les fonctionnalités GIE ne sont visibles que pour les utilisateurs avec `userType === 'GIE'`
- Ignorance des feature flags pour la sécurité (basé uniquement sur userType)

---

## [1.1.0] - 2025-XX-XX

### ✨ Ajouté
- Version initiale avec fonctionnalités de base
- Authentification Supabase
- Gestion des transactions (Revenus/Dépenses)
- Intégration vocale VAPI
- Dashboard avec statistiques
- Export de reçus

---

## Format des versions

- **MAJOR** (1.x.x): Changements majeurs, breaking changes
- **MINOR** (x.1.x): Nouvelles fonctionnalités, compatibilité arrière
- **PATCH** (x.x.1): Corrections de bugs, petites améliorations

---

## Notes de déploiement

### Version 1.2.0
- **Type de déploiement**: OTA Update + Nouveau Build (recommandé)
- **Migration DB**: Aucune migration requise (fonctionnalités client-side uniquement)
- **Compatibilité**: Compatible avec la version 1.1.0
- **Actions requises**:
  - Les utilisateurs existants recevront la mise à jour automatiquement via OTA
  - Les nouveaux utilisateurs téléchargeront le nouveau build

---

**Dernière mise à jour:** 2025-11-06


