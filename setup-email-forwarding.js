#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://avltdtbgantbxbrqdxge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupEmailForwarding() {
  console.log('📧 Configuration de la réception d\'emails Sentreso\n');
  console.log('=' .repeat(60));

  console.log('📋 Options pour accéder à abdoul@sentreso.com:\n');

  console.log('1️⃣ **Mailgun (Recommandé pour commencer):**');
  console.log('   • Connectez-vous à https://mailgun.com');
  console.log('   • Allez dans "Sending" → "Domains"');
  console.log('   • Sélectionnez sentreso.com');
  console.log('   • Activez "Receiving"');
  console.log('   • Créez une route: abdoul@sentreso.com → kaneaziz@gmail.com');
  console.log('   • Coût: Gratuit pour 5,000 emails/mois');

  console.log('\n2️⃣ **Google Workspace (Professionnel):**');
  console.log('   • Allez sur https://workspace.google.com');
  console.log('   • Créez un compte pour sentreso.com');
  console.log('   • Configurez abdoul@sentreso.com');
  console.log('   • Interface Gmail complète');
  console.log('   • Coût: $6/mois/utilisateur');

  console.log('\n3️⃣ **Votre Registrar (Simple):**');
  console.log('   • Connectez-vous à votre panel registrar');
  console.log('   • Activez les emails pour sentreso.com');
  console.log('   • Créez abdoul@sentreso.com');
  console.log('   • Coût: Variable selon le registrar');

  console.log('\n4️⃣ **Solution Temporaire (Redirection):**');
  console.log('   • Configurez une redirection DNS');
  console.log('   • Tous les emails @sentreso.com → kaneaziz@gmail.com');
  console.log('   • Gratuit mais moins professionnel');
}

async function testEmailAccess() {
  console.log('\n🧪 Test d\'accès aux emails...\n');

  console.log('📤 Envoi d\'un email de test vers abdoul@sentreso.com...');

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail('abdoul@sentreso.com', {
      redirectTo: 'https://sentreso.com/reset-password'
    });

    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
    } else {
      console.log('✅ Email envoyé avec succès!');
      console.log('\n📋 Pour récupérer cet email:');
      console.log('1. Vérifiez kaneaziz@gmail.com (boîte de réception et spam)');
      console.log('2. Ou configurez la réception dans Mailgun');
      console.log('3. Ou activez Google Workspace');
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

function showDNSConfiguration() {
  console.log('\n🌐 Configuration DNS pour la réception:\n');

  console.log('📋 Enregistrements MX actuels (pour envoi):');
  console.log('   MX: mxa.mailgun.org, mxb.mailgun.org');

  console.log('\n📋 Enregistrements pour la réception (selon l\'option choisie):');

  console.log('\n🔹 **Option Mailgun:**');
  console.log('   • Les MX actuels gèrent aussi la réception');
  console.log('   • Configurez les routes dans le dashboard Mailgun');

  console.log('\n🔹 **Option Google Workspace:**');
  console.log('   MX: aspmx.l.google.com');
  console.log('   MX: alt1.aspmx.l.google.com');
  console.log('   MX: alt2.aspmx.l.google.com');
  console.log('   TXT: v=spf1 include:_spf.google.com ~all');

  console.log('\n🔹 **Option Registrar:**');
  console.log('   • Utilisez les serveurs de votre registrar');
  console.log('   • Exemple: mx1.votreregistrar.com');
}

function showImmediateSteps() {
  console.log('\n🚀 Étapes immédiates pour accéder à abdoul@sentreso.com:\n');

  console.log('1️⃣ **Solution rapide (Mailgun):**');
  console.log('   • Connectez-vous à https://mailgun.com');
  console.log('   • Allez dans "Sending" → "Domains"');
  console.log('   • Cliquez sur "sentreso.com"');
  console.log('   • Activez "Receiving"');
  console.log('   • Créez une route:');
  console.log('     - Pattern: abdoul@sentreso.com');
  console.log('     - Action: forward to kaneaziz@gmail.com');

  console.log('\n2️⃣ **Vérification:**');
  console.log('   • Envoyez un email de test');
  console.log('   • Vérifiez kaneaziz@gmail.com');
  console.log('   • Les emails devraient arriver en quelques minutes');

  console.log('\n3️⃣ **Configuration avancée:**');
  console.log('   • Personnalisez les templates de réponse');
  console.log('   • Configurez les filtres anti-spam');
  console.log('   • Activez les notifications');
}

// Fonction principale
async function main() {
  console.log('📧 Configuration Réception Email - Sentreso Finance\n');

  await setupEmailForwarding();
  await testEmailAccess();
  showDNSConfiguration();
  showImmediateSteps();

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Configuration terminée!');
  console.log('\n📧 Prochaines étapes:');
  console.log('1. Choisissez votre option de réception');
  console.log('2. Configurez dans le dashboard correspondant');
  console.log('3. Testez l\'envoi et la réception');
  console.log('4. Personnalisez selon vos besoins');

  console.log('\n📞 Support:');
  console.log('   • Mailgun: https://help.mailgun.com');
  console.log('   • Google Workspace: https://support.google.com');
  console.log('   • Sentreso: support@sentreso.com (après configuration)');
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  setupEmailForwarding,
  testEmailAccess,
  showDNSConfiguration,
  showImmediateSteps
};
