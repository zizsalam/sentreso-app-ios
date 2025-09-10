#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEmailConfiguration() {
  console.log('🚀 Configuration Email Sentreso Finance\n');
  console.log('=' .repeat(60));

  try {
    // Collecter les informations de configuration
    console.log('📋 Collecte des informations de configuration...\n');

    const projectId = await question('🔗 ID de votre projet Supabase: ');
    const apiUrl = `https://${projectId}.supabase.co`;

    const anonKey = await question('🔑 Clé anonyme Supabase: ');
    const serviceRoleKey = await question('🔐 Clé de service Supabase: ');

    console.log('\n📧 Configuration SMTP Mailgun...\n');

    const mailgunUsername = await question('👤 Username Mailgun: ');
    const mailgunPassword = await question('🔒 Password Mailgun: ');

    // Créer la configuration
    const config = {
      project_id: projectId,
      api_url: apiUrl,
      anon_key: anonKey,
      service_role_key: serviceRoleKey,
      email: {
        smtp: {
          host: 'smtp.mailgun.org',
          port: 587,
          username: mailgunUsername,
          password: mailgunPassword,
          sender_name: 'Sentreso Finance',
          sender_email: 'support@sentreso.com'
        },
        templates: {
          confirm_signup: {
            subject: 'Bienvenue sur Sentreso Finance !',
            html: `<h2>Bienvenue sur Sentreso Finance !</h2>
<p>Bonjour {{ .Name }},</p>
<p>Merci de vous être inscrit sur Sentreso Finance. Votre compte a été créé avec succès.</p>
<p>Pour toute question, contactez-nous à support@sentreso.com</p>
<p>Cordialement,<br>L'équipe Sentreso</p>`
          },
          recovery: {
            subject: 'Réinitialisation de votre mot de passe - Sentreso Finance',
            html: `<h2>Réinitialisation de votre mot de passe</h2>
<p>Bonjour {{ .Name }},</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
<p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
<a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a>
<p>Ce lien expire dans 24 heures.</p>
<p>Cordialement,<br>L'équipe Sentreso</p>`
          }
        }
      },
      domains: {
        primary: 'sentreso.com',
        site_url: 'https://sentreso.com',
        redirect_urls: [
          'https://sentreso.com/auth/callback',
          'https://sentreso.com/reset-password'
        ]
      }
    };

    // Sauvegarder la configuration
    fs.writeFileSync('supabase-config.json', JSON.stringify(config, null, 2));
    console.log('✅ Configuration sauvegardée dans supabase-config.json');

    // Créer le fichier .env
    const envContent = `# Configuration Supabase pour Sentreso Finance
SUPABASE_URL=${apiUrl}
SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}

# Configuration Email
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=${mailgunUsername}
SMTP_PASSWORD=${mailgunPassword}

# Adresses email Sentreso
SUPPORT_EMAIL=support@sentreso.com
PERSONAL_EMAIL=abdoul@sentreso.com

# Configuration du domaine
DOMAIN=sentreso.com
SITE_URL=https://sentreso.com
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ Variables d\'environnement sauvegardées dans .env');

    // Tester la configuration
    console.log('\n🧪 Test de la configuration...');

    const supabase = createClient(apiUrl, anonKey);

    // Test de connexion
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.log('⚠️  Erreur de connexion:', error.message);
    } else {
      console.log('✅ Connexion Supabase réussie');
    }

    // Instructions finales
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Configuration terminée !');
    console.log('\n📋 Prochaines étapes :');
    console.log('1. Configurez les enregistrements DNS (voir SUPABASE_EMAIL_SETUP.md)');
    console.log('2. Connectez-vous à Supabase Dashboard');
    console.log('3. Allez dans Settings → Auth → Email Templates');
    console.log('4. Configurez SMTP avec les informations Mailgun');
    console.log('5. Testez l\'envoi d\'emails avec : node test-email-config.js');

    console.log('\n📧 Adresses email configurées :');
    console.log('   • support@sentreso.com');
    console.log('   • abdoul@sentreso.com');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
  } finally {
    rl.close();
  }
}

// Exécuter le script
if (require.main === module) {
  setupEmailConfiguration();
}

module.exports = { setupEmailConfiguration };
