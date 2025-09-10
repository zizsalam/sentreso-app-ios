# 🧪 Guide de Test Manuel - Conformité Apple

## 📱 Test de l'application avant soumission

### **Étape 1 : Installation et lancement**

1. **Construire l'app :**
   ```bash
   npx eas build --platform ios
   ```

2. **Installer sur un iPhone** (physique ou simulateur)

3. **Lancer l'application**

---

### **Étape 2 : Test de collecte de données (Guideline 5.1.1)**

#### **Test A : Nom uniquement**
1. Sur l'écran de connexion, entrer seulement votre nom
2. Laisser le champ "Téléphone (optionnel)" **VIDE**
3. Laisser le champ "Email (optionnel)" **VIDE**
4. Cliquer "Continuer"
5. **✅ Résultat attendu :** L'app fonctionne normalement

#### **Test B : Validation des champs**
1. Essayer de continuer sans nom (champs vides)
2. **✅ Résultat attendu :** Message "Le nom est obligatoire"
3. Entrer un nom, laisser téléphone vide
4. **✅ Résultat attendu :** L'app fonctionne normalement

#### **Test C : Téléphone optionnel**
1. Entrer nom + téléphone + email
2. Cliquer "Continuer"
3. **✅ Résultat attendu :** L'app fonctionne normalement
4. Recommencer avec nom + téléphone vide + email
5. **✅ Résultat attendu :** L'app fonctionne normalement

---

### **Étape 3 : Test de suppression de compte (Guideline 5.1.1(v))**

#### **Test A : Fonction de suppression**
1. Dans l'écran de connexion, localiser le bouton "Supprimer mon compte"
2. **✅ Vérifier :** Le bouton est visible et accessible

#### **Test B : Processus de suppression**
1. Cliquer "Supprimer mon compte"
2. **✅ Résultat attendu :** Alert de confirmation apparaît
3. Cliquer "Annuler"
4. **✅ Résultat attendu :** Retour à l'écran de connexion
5. Cliquer "Supprimer mon compte" puis "Supprimer"
6. **✅ Résultat attendu :** Message "Compte supprimé avec succès"

#### **Test C : Vérification de suppression**
1. Après suppression, vérifier que les champs sont vides
2. **✅ Résultat attendu :** Toutes les données utilisateur sont supprimées

#### **Test D : Fonction de déconnexion**
1. Dans l'écran d'accueil, localiser le bouton 🚪 (déconnexion) en haut à droite
2. Cliquer sur le bouton de déconnexion
3. **✅ Résultat attendu :** Alert de confirmation "Êtes-vous sûr de vouloir vous déconnecter ?"
4. Cliquer "Annuler"
5. **✅ Résultat attendu :** Retour à l'écran d'accueil
6. Cliquer "Déconnexion" puis "Déconnexion"
7. **✅ Résultat attendu :** Message "Vous avez été déconnecté avec succès" et retour à l'écran de connexion

---

### **Étape 4 : Test des fonctionnalités principales**

#### **Test A : Navigation**
1. Après connexion, tester la navigation entre les onglets
2. **✅ Vérifier :** Accueil, Ajouter, Vocal, Stats fonctionnent

#### **Test B : Ajout de transaction**
1. Aller dans l'onglet "Ajouter"
2. Remplir les champs (montant, description, catégorie)
3. Cliquer "Ajouter la Transaction"
4. **✅ Résultat attendu :** Transaction ajoutée avec succès

#### **Test C : Enregistrement vocal**
1. Aller dans l'onglet "Vocal"
2. Tester l'enregistrement vocal
3. **✅ Résultat attendu :** Fonctionne correctement

---

### **Étape 5 : Vérification des métadonnées**

#### **Test A : Captures d'écran**
1. Ouvrir `app_images.html` dans le navigateur
2. Télécharger les captures d'écran iPhone (1320x2868)
3. **✅ Vérifier :** Images de haute qualité, format correct

#### **Test B : Icône de l'app**
1. Télécharger l'icône 1024x1024
2. **✅ Vérifier :** Format PNG, pas de transparence

---

## ✅ **Checklist de conformité finale**

### **Guideline 5.1.1 - Collecte de données**
- [ ] Numéro de téléphone optionnel ✅
- [ ] Seul le nom est obligatoire ✅
- [ ] Validation correcte des champs ✅
- [ ] L'app fonctionne sans téléphone ✅

### **Guideline 5.1.1(v) - Suppression de compte**
- [ ] Bouton "Supprimer mon compte" visible ✅
- [ ] Confirmation avant suppression ✅
- [ ] Suppression effective des données ✅
- [ ] Feedback utilisateur ✅

### **Fonctionnalités de contrôle utilisateur**
- [ ] Bouton de déconnexion visible ✅
- [ ] Confirmation avant déconnexion ✅
- [ ] Déconnexion effective ✅
- [ ] Retour à l'écran de connexion ✅

### **Configuration technique**
- [ ] `supportsTablet: false` ✅
- [ ] Build numbers incrémentés ✅
- [ ] Captures d'écran iPhone uniquement ✅

---

## 🚀 **Prêt pour soumission**

Si tous les tests passent ✅, l'app est conforme et peut être soumise à Apple.

### **Instructions de soumission :**
1. Construire : `npx eas build --platform ios`
2. Uploader vers App Store Connect
3. Vérifier les métadonnées
4. Soumettre pour vérification
5. Attendre 24-48 heures

### **Réponse à Apple (si nécessaire) :**
> "Nous avons corrigé les problèmes identifiés :
> - Numéro de téléphone rendu optionnel
> - Fonction de suppression de compte ajoutée
> - Support iPad désactivé
> L'app est maintenant conforme aux guidelines 5.1.1 et 5.1.1(v)."

---

## 📞 **Support**

Si vous rencontrez des problèmes :
1. Vérifiez les logs de construction
2. Testez sur un appareil physique
3. Consultez la documentation Apple
4. Contactez le support Apple si nécessaire
