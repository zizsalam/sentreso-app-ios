# Guide de Migration DNS - PrivateEmail vers Mailgun

## 📋 État Actuel
Votre domaine `sentreso.com` utilise actuellement **PrivateEmail** :
- MX: mx1.privateemail.com, mx2.privateemail.com

## 🎯 Objectif
Migrer vers **Mailgun** pour utiliser Supabase Email avec votre domaine.

## 🔄 Étapes de Migration

### 1. **Créer un compte Mailgun**
1. Allez sur https://mailgun.com
2. Créez un compte avec votre email : kaneaziz@gmail.com
3. Ajoutez votre domaine : sentreso.com
4. Mailgun vous fournira les enregistrements DNS à ajouter

### 2. **Enregistrements DNS à modifier**

#### **Remplacer les enregistrements MX actuels :**
```
❌ ACTUEL (à supprimer) :
Type: MX
Name: @
Value: mx1.privateemail.com
Priority: 10

Type: MX
Name: @
Value: mx2.privateemail.com
Priority: 10

✅ NOUVEAU (à ajouter) :
Type: MX
Name: @
Value: mxa.mailgun.org
Priority: 10

Type: MX
Name: @
Value: mxb.mailgun.org
Priority: 10
```

#### **Ajouter l'enregistrement SPF :**
```
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all
```

#### **Ajouter l'enregistrement DKIM (fourni par Mailgun) :**
```
Type: TXT
Name: k1._domainkey
Value: [Valeur fournie par Mailgun]
```

### 3. **Configuration dans Supabase Dashboard**

1. **Connectez-vous à Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Projet: avltdtbgantbxbrqdxge

2. **Configuration Email**
   - Allez dans "Settings" → "Auth" → "Email Templates"
   - Cliquez sur "Configure SMTP settings"

3. **Paramètres SMTP Mailgun**
   ```
   Host: smtp.mailgun.org
   Port: 587
   Username: kaneaziz@gmail.com
   Password: cQfJ!R2tp42KqV@
   Sender Name: Sentreso Finance
   Sender Email: support@sentreso.com
   ```

### 4. **Création des adresses email**

#### **Dans Mailgun Dashboard :**
1. Allez dans "Sending" → "Domains"
2. Sélectionnez sentreso.com
3. Créez les adresses :
   - support@sentreso.com
   - abdoul@sentreso.com

#### **Configuration des redirections :**
- support@sentreso.com → redirection vers équipe support
- abdoul@sentreso.com → email personnel

### 5. **Test de la configuration**

Après avoir configuré les DNS, testez avec :

```bash
# Vérifier les nouveaux enregistrements MX
dig MX sentreso.com

# Vérifier l'enregistrement SPF
dig TXT sentreso.com

# Vérifier l'enregistrement DKIM
dig TXT k1._domainkey.sentreso.com

# Tester l'envoi d'email
node test-email-config.js
```

## ⚠️ **Important : Sauvegarde**

### **Avant la migration :**
1. Sauvegardez tous les emails importants de PrivateEmail
2. Notez les redirections actuelles
3. Préparez les nouveaux templates

### **Pendant la migration :**
1. Les emails peuvent être temporairement indisponibles (24-48h)
2. Surveillez les logs Mailgun
3. Testez l'envoi et la réception

## 📧 **Templates Email Supabase**

### **Template de Bienvenue**
```html
<h2>Bienvenue sur Sentreso Finance !</h2>
<p>Bonjour {{ .Name }},</p>
<p>Merci de vous être inscrit sur Sentreso Finance. Votre compte a été créé avec succès.</p>
<p>Pour toute question, contactez-nous à support@sentreso.com</p>
<p>Cordialement,<br>L'équipe Sentreso</p>
```

### **Template de Réinitialisation**
```html
<h2>Réinitialisation de votre mot de passe</h2>
<p>Bonjour {{ .Name }},</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
<p>Cliquez sur le lien ci-dessous :</p>
<a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a>
<p>Ce lien expire dans 24 heures.</p>
<p>Cordialement,<br>L'équipe Sentreso</p>
```

## 🔧 **Script de Test**

Utilisez le script de test pour vérifier la configuration :

```bash
# Charger les variables d'environnement
source .env

# Tester la configuration
node test-email-config.js
```

## 📞 **Support**

En cas de problème :
- **Documentation Mailgun**: https://documentation.mailgun.com/
- **Documentation Supabase**: https://supabase.com/docs/guides/auth/email
- **Support Sentreso**: support@sentreso.com (après configuration)

## ⏱️ **Timeline**

1. **Jour 1**: Configuration Mailgun et DNS
2. **Jour 2**: Vérification et tests
3. **Jour 3**: Configuration Supabase et templates
4. **Jour 4**: Tests finaux et mise en production
