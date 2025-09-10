# Configuration Email Supabase - sentreso.com

## 1. Configuration DNS

Ajoutez ces enregistrements DNS à votre domaine `sentreso.com` :

### Enregistrements MX
```
Type: MX
Name: @
Value: mxa.mailgun.org
Priority: 10

Type: MX
Name: @
Value: mxb.mailgun.org
Priority: 10
```

### Enregistrements SPF
```
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all
```

### Enregistrements DKIM
```
Type: TXT
Name: k1._domainkey
Value: [Valeur fournie par Supabase]
```

### Enregistrements CNAME
```
Type: CNAME
Name: email
Value: mailgun.org
```

## 2. Configuration dans Supabase Dashboard

1. **Connectez-vous à Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet Sentreso

2. **Configuration Email**
   - Allez dans "Settings" → "Auth" → "Email Templates"
   - Cliquez sur "Configure SMTP settings"

3. **Paramètres SMTP**
   ```
   Host: smtp.mailgun.org
   Port: 587
   Username: [votre-username-mailgun]
   Password: [votre-password-mailgun]
   Sender Name: Sentreso Finance
   Sender Email: support@sentreso.com
   ```

## 3. Adresses Email à créer

### Support Email
- **Adresse**: support@sentreso.com
- **Usage**: Support client, questions utilisateurs
- **Configuration**: Répondre automatique, redirection vers équipe

### Email Personnel (Abdoul)
- **Adresse**: abdoul@sentreso.com
- **Usage**: Communication interne, partenariats
- **Configuration**: Email personnel avec signature professionnelle

## 4. Templates Email Supabase

### Template de Bienvenue
```html
<h2>Bienvenue sur Sentreso Finance !</h2>
<p>Bonjour {{ .Name }},</p>
<p>Merci de vous être inscrit sur Sentreso Finance. Votre compte a été créé avec succès.</p>
<p>Pour toute question, contactez-nous à support@sentreso.com</p>
<p>Cordialement,<br>L'équipe Sentreso</p>
```

### Template de Réinitialisation de Mot de Passe
```html
<h2>Réinitialisation de votre mot de passe</h2>
<p>Bonjour {{ .Name }},</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
<p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
<a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a>
<p>Ce lien expire dans 24 heures.</p>
<p>Cordialement,<br>L'équipe Sentreso</p>
```

## 5. Configuration Mailgun (Alternative)

Si vous préférez utiliser Mailgun directement :

1. **Créer un compte Mailgun**
   - Allez sur https://mailgun.com
   - Créez un compte avec votre domaine sentreso.com

2. **Vérification du domaine**
   - Ajoutez les enregistrements DNS fournis par Mailgun
   - Attendez la vérification (24-48h)

3. **Configuration des emails**
   - Créez les adresses support@sentreso.com et abdoul@sentreso.com
   - Configurez les redirections et réponses automatiques

## 6. Test de Configuration

### Test d'envoi
```bash
# Test via Supabase CLI
npx supabase auth test-email --email abdoul@sentreso.com
```

### Vérification DNS
```bash
# Vérifier les enregistrements MX
dig MX sentreso.com

# Vérifier l'enregistrement SPF
dig TXT sentreso.com

# Vérifier l'enregistrement DKIM
dig TXT k1._domainkey.sentreso.com
```

## 7. Coûts et Limites

### Supabase Email
- **Gratuit**: 50,000 emails/mois
- **Payant**: $0.50/10,000 emails supplémentaires

### Mailgun
- **Gratuit**: 5,000 emails/mois pour les 3 premiers mois
- **Payant**: $35/mois pour 50,000 emails

## 8. Sécurité

### Recommandations
- Utilisez des mots de passe forts
- Activez l'authentification à deux facteurs
- Surveillez les logs d'envoi
- Configurez les alertes de quota

### Protection contre le spam
- Configurez SPF, DKIM, et DMARC
- Surveillez la réputation de votre domaine
- Utilisez des listes de blocage

## 9. Support

Pour toute question sur la configuration :
- **Documentation Supabase**: https://supabase.com/docs/guides/auth/email
- **Documentation Mailgun**: https://documentation.mailgun.com/
- **Support Sentreso**: support@sentreso.com (une fois configuré)
