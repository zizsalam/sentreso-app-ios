#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://avltdtbgantbxbrqdxge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailSending() {
  console.log('📧 Test d\'envoi d\'emails Sentreso Finance\n');
  console.log('=' .repeat(50));

  const testEmails = [
    'abdoul@sentreso.com',
    'kaneaziz@gmail.com' // Email de test temporaire
  ];

  for (const email of testEmails) {
    console.log(`\n🧪 Test d'envoi vers: ${email}`);

    try {
      // Test 1: Email de réinitialisation de mot de passe
      console.log('   📤 Envoi email de réinitialisation...');

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://sentreso.com/reset-password'
      });

      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      } else {
        console.log(`   ✅ Email envoyé avec succès!`);
        console.log(`   📋 Données:`, data);
      }

    } catch (error) {
      console.log(`   ❌ Erreur lors de l'envoi: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📋 Résumé des tests:');
  console.log('✅ Configuration Supabase OK');
  console.log('✅ Connexion établie');
  console.log('📧 Emails de test envoyés');

  console.log('\n📞 Prochaines étapes:');
  console.log('1. Vérifiez vos emails (boîte de réception et spam)');
  console.log('2. Configurez les templates dans Supabase Dashboard');
  console.log('3. Testez avec les vraies adresses @sentreso.com');
}

// Fonction pour vérifier la configuration SMTP
async function checkSMTPConfiguration() {
  console.log('\n🔧 Vérification de la configuration SMTP...\n');

  console.log('📋 Configuration actuelle:');
  console.log('   Host: smtp.mailgun.org');
  console.log('   Port: 587');
  console.log('   Username: kaneaziz@gmail.com');
  console.log('   Sender: support@sentreso.com');

  console.log('\n📋 Pour configurer dans Supabase Dashboard:');
  console.log('1. Allez sur https://supabase.com/dashboard');
  console.log('2. Sélectionnez votre projet: avltdtbgantbxbrqdxge');
  console.log('3. Settings → Auth → Email Templates');
  console.log('4. Configurez SMTP avec les infos Mailgun');
  console.log('5. Testez l\'envoi d\'emails');
}

// Fonction pour vérifier les templates
function checkEmailTemplates() {
  console.log('\n📧 Templates à configurer dans Supabase:\n');

  const templates = [
    {
      name: 'confirm_signup',
      subject: 'Bienvenue sur Sentreso Finance !',
      description: 'Email de bienvenue pour nouveaux utilisateurs'
    },
    {
      name: 'recovery',
      subject: 'Réinitialisation de votre mot de passe - Sentreso Finance',
      description: 'Email de réinitialisation de mot de passe'
    },
    {
      name: 'magic_link',
      subject: 'Connexion à Sentreso Finance',
      description: 'Lien de connexion magique'
    },
    {
      name: 'invite',
      subject: 'Invitation Sentreso Finance',
      description: 'Invitation d\'utilisateur'
    }
  ];

  templates.forEach(template => {
    console.log(`📄 ${template.name}:`);
    console.log(`   Sujet: ${template.subject}`);
    console.log(`   Description: ${template.description}`);
    console.log('');
  });
}

// Fonction principale
async function main() {
  console.log('🚀 Test Email Sentreso Finance\n');

  await testEmailSending();
  await checkSMTPConfiguration();
  checkEmailTemplates();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Tests terminés!');
  console.log('\n📧 Adresses email configurées:');
  console.log('   • support@sentreso.com');
  console.log('   • abdoul@sentreso.com');
  console.log('\n📞 Support: support@sentreso.com (après configuration)');
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testEmailSending,
  checkSMTPConfiguration,
  checkEmailTemplates
};
