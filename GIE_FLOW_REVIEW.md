# Revue du Flux GIE - Sentreso App

## 📋 Vue d'ensemble du flux

### 1. **Authentification & Onboarding**

#### Flux actuel :
```
Login → Onboarding (si userType manquant) → Tabs
```

#### Points forts ✅
- Redirection automatique vers `/onboarding` après login
- Vérification de `userType` dans `UserContext`
- Interface claire pour choisir Merchant/GIE
- Récupération des infos utilisateur depuis Supabase auth

#### Points à améliorer ⚠️
- **Navigation après onboarding** : Le `UserTypeOnboarding` redirige directement vers `/(tabs)` sans vérifier si l'utilisateur a besoin d'autres étapes
- **Gestion des erreurs** : Pas de feedback visuel si `setUserDetails` échoue
- **Persistance** : `userType` est stocké dans AsyncStorage mais pas dans Supabase (pas de sync multi-appareil)

---

### 2. **Écran Ajouter Transaction (Add Tab)**

#### Flux actuel :
```
Add Tab → Sélection activité → Sélection membre (si GIE) → Montant → Soumettre
```

#### Points forts ✅
- **Activités tiles** : Interface visuelle claire avec sélection visuelle (bordure verte)
- **Amount chips** : 1000, 2500, 5000, 10000 FCFA pour saisie rapide
- **Sélection membre** : Grid avec photos/initiales, section "Récents"
- **Description automatique** : `"Cotisation de Fatou"` généré automatiquement
- **Reset après soumission** : Forme réinitialisée après 2s

#### Points à améliorer ⚠️
- **Validation** : Pas de validation si membre sélectionné mais activité non-GIE (ex: "Dépense opé" avec membre)
- **Feedback** : Le message de succès disparaît trop vite (2s) - difficile à voir
- **Navigation** : Redirige vers `/(tabs)/` (home) mais devrait peut-être rester sur Add pour enregistrer plusieurs transactions rapidement
- **Catégories** : Liste de catégories génériques affichée même en mode GIE (peut être confus)

---

### 3. **Écran Réunion (Meeting Tab)**

#### Flux actuel :
```
Meeting Tab → Affiche transactions d'aujourd'hui → Export CSV/PDF/WhatsApp
```

#### Points forts ✅
- **Filtrage par date** : Utilise `createdAt.toISOString().slice(0, 10)` pour filtrer correctement
- **Groupement intelligent** : Somme les montants par membre + type (ex: 2 cotisations de Fatou = 1 ligne)
- **Extraction membre** : Parse `"Cotisation de Fatou"` → `"Fatou"` correctement
- **Totaux synchronisés** : Cotisations, Remboursements, Prêts calculés correctement
- **PDF professionnel** : En-tête GIE, tableau structuré, totaux, footer
- **Exports multiples** : CSV, PDF, WhatsApp

#### Points à améliorer ⚠️
- **Date fixe** : Utilise toujours "aujourd'hui" - pas de sélection de date pour réunions passées
- **GIE details** : Le PDF utilise `userDetails.name` mais pas d'adresse (mentionné par l'utilisateur)
- **Empty state** : Message "Aucune transaction aujourd'hui" mais pas de CTA pour en ajouter
- **Performance** : Avec 80+ membres, le `useMemo` recalcule à chaque render (peut être optimisé)

---

### 4. **Gestion des Membres**

#### Flux actuel :
```
Add Member Modal → Nom (requis) + Téléphone (optionnel) + Photo (optionnelle) → Sauvegarde locale
MemberGrid → Affiche tous les membres + Récents (5 derniers utilisés)
```

#### Points forts ✅
- **Stockage local** : AsyncStorage pour offline-first
- **Photos** : Caméra + Galerie avec permissions
- **Récents** : Section dédiée pour accès rapide
- **Initiales** : Fallback si pas de photo
- **Duplicate hint** : Détection de noms similaires

#### Points à améliorer ⚠️
- **Pas de sync** : Membres stockés localement uniquement (pas de partage entre appareils du même GIE)
- **Pas d'édition** : Impossible de modifier un membre existant (nom, téléphone, photo)
- **Pas de suppression** : Impossible de supprimer un membre
- **Pas de recherche** : Avec 80+ membres, difficile de trouver quelqu'un
- **Pas de tri** : Affichage par ordre d'ajout, pas alphabétique

---

### 5. **Feature Flags & Configuration**

#### Points forts ✅
- **Flags flexibles** : `gie_mode`, `gie_exports`, `gie_member_tracking`
- **Détection automatique** : `userDetails?.userType === 'GIE'` active les features
- **Tab conditionnel** : "Réunion" tab visible uniquement si `gie_mode` activé

#### Points à améliorer ⚠️
- **Configuration** : Flags dans `app.json` en dur (dev uniquement)
- **Pas de toggle** : Pas d'interface pour activer/désactiver en production
- **Flags multiples** : `gie_exports || gie_mode` peut être confus

---

## 🔄 Flux complet visualisé

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Onboarding  │ ──► Merchant ou GIE ?
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Tabs      │
│  (Home)     │
└──────┬──────┘
       │
       ├──► Add Tab ──► [Activité] ──► [Membre] ──► [Montant] ──► Transaction créée
       │
       ├──► Meeting Tab ──► Transactions aujourd'hui ──► Export CSV/PDF/WhatsApp
       │
       └──► Analytics Tab (existant)
```

---

## 🎯 Recommandations prioritaires

### **Priorité Haute** 🔴

1. **Ajouter adresse GIE dans PDF**
   - Ajouter champ `address` dans `UserContext`
   - Afficher dans l'en-tête du PDF

2. **Améliorer feedback après transaction**
   - Message de succès plus visible (toast persistant)
   - Option "Ajouter une autre transaction" au lieu de rediriger

3. **Sélection de date pour Meeting**
   - Permettre de voir les transactions d'une date passée
   - Bouton "Aujourd'hui" pour revenir à la date actuelle

### **Priorité Moyenne** 🟡

4. **Édition/Suppression membres**
   - Long-press sur membre → Menu (Éditer/Supprimer)
   - Modal d'édition avec pré-remplissage

5. **Recherche membres**
   - Barre de recherche dans `MemberGrid`
   - Filtrage en temps réel

6. **Tri membres**
   - Tri alphabétique par défaut
   - Option "Récents" / "Tous" / "Alphabétique"

### **Priorité Basse** 🟢

7. **Sync membres multi-appareil**
   - Table Supabase `gie_members` pour partage entre appareils
   - Sync bidirectionnelle avec résolution de conflits

8. **Validation améliorée**
   - Vérifier que membre est sélectionné pour activités GIE (Cotisation, Prêt, etc.)
   - Message d'erreur clair si validation échoue

9. **Performance optimisations**
   - Memoization plus agressive dans `MeetingTab`
   - Virtualisation de la liste des membres (FlatList avec `windowSize`)

---

## 🧪 Tests à effectuer

### Scénarios critiques

1. **Nouvel utilisateur GIE**
   - Login → Onboarding → Sélection GIE → Vérifier tab "Réunion" visible

2. **Transaction avec membre**
   - Add Tab → Activité "Cotisation" → Sélection membre → Montant → Soumettre
   - Vérifier que description = "Cotisation de [Nom]"
   - Vérifier que transaction apparaît dans Meeting Tab

3. **Export PDF**
   - Meeting Tab → Plusieurs transactions aujourd'hui → Export PDF
   - Vérifier en-tête GIE, totaux, tableau complet

4. **Membres multiples**
   - Ajouter 10+ membres → Vérifier performance de `MemberGrid`
   - Vérifier section "Récents" fonctionne

5. **Offline**
   - Désactiver internet → Ajouter transaction → Vérifier que ça fonctionne
   - Réactiver internet → Vérifier sync

---

## 📝 Notes techniques

### Points d'attention

- **Date filtering** : Utilise `toISOString().slice(0, 10)` - attention au timezone
- **Member extraction** : Regex patterns peuvent échouer si format description change
- **AsyncStorage** : Limite ~6MB sur iOS, ~10MB sur Android
- **PDF generation** : `expo-print` peut être lent avec beaucoup de transactions

### Dépendances critiques

- `@react-native-async-storage/async-storage` : Stockage local membres
- `expo-image-picker` : Photos membres
- `expo-print` : Génération PDF
- `expo-sharing` : Partage fichiers
- `expo-linking` : WhatsApp sharing

---

## ✅ Checklist de validation

- [x] Onboarding fonctionne pour nouveaux utilisateurs
- [x] Tab "Réunion" visible uniquement en mode GIE
- [x] Transactions avec membres créées correctement
- [x] Meeting Tab affiche transactions d'aujourd'hui
- [x] Totaux synchronisés avec liste
- [x] PDF export génère rapport professionnel
- [x] CSV export fonctionne
- [x] WhatsApp sharing fonctionne
- [ ] Adresse GIE dans PDF
- [ ] Édition membres
- [ ] Recherche membres
- [ ] Sélection date dans Meeting Tab

---

*Dernière mise à jour : 2025-11-06*


