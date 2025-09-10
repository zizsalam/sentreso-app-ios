#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://avltdtbgantbxbrqdxge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMailgunRoute() {
  console.log('🧪 Test de la route Mailgun pour abdoul@sentreso.com\n');
  console.log('=' .repeat(60));

  const testEmails = [
    'abdoul@sentreso.com',
    'support@sentreso.com',
    'test@sentreso.com'
  ];

  console.log('📋 Configuration de la route Mailgun:\n');
  console.log('✅ Expression: Catch All');
  console.log('✅ Action: Forward');
  console.log('✅ Destination: kaneaziz@gmail.com');
  console.log('✅ Priority: 0');

  console.log('\n📤 Envoi d\'emails de test...\n');

  for (const email of testEmails) {
    console.log(`🧪 Test vers: ${email}`);

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://sentreso.com/reset-password'
      });

      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      } else {
        console.log(`   ✅ Email envoyé avec succès!`);
        console.log(`   📧 Devrait arriver dans kaneaziz@gmail.com`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    console.log('');
  }

  console.log('=' .repeat(60));
  console.log('📋 Instructions de vérification:\n');

  console.log('1️⃣ **Vérifiez votre Gmail:**');
  console.log('   • Ouvrez kaneaziz@gmail.com');
  console.log('   • Regardez dans la boîte de réception');
  console.log('   • Vérifiez aussi le dossier spam');

  console.log('\n2️⃣ **Temps d\'arrivée:**');
  console.log('   • Normalement: 1-5 minutes');
  console.log('   • Si pas d\'email: vérifiez la configuration Mailgun');

  console.log('\n3️⃣ **Si les emails n\'arrivent pas:**');
  console.log('   • Vérifiez que la route est activée dans Mailgun');
  console.log('   • Vérifiez que les MX sont bien configurés');
  console.log('   • Attendez 24-48h pour la propagation DNS');

  console.log('\n4️⃣ **Configuration avancée:**');
  console.log('   • Créez des routes spécifiques pour chaque adresse');
  console.log('   • Configurez des filtres anti-spam');
  console.log('   • Activez les logs pour le debugging');
}

function showMailgunDashboardSteps() {
  console.log('\n🔧 Étapes dans Mailgun Dashboard:\n');

  console.log('1️⃣ **Créer la route:**');
  console.log('   • Expression: Catch All');
  console.log('   • Action: Forward');
  console.log('   • Destination: kaneaziz@gmail.com');
  console.log('   • Priority: 0');
  console.log('   • Description: Forward all sentreso.com emails');

  console.log('\n2️⃣ **Vérifier la configuration:**');
  console.log('   • Allez dans "Sending" → "Domains"');
  console.log('   • Cliquez sur sentreso.com');
  console.log('   • Vérifiez que "Receiving" est activé');
  console.log('   • Vérifiez que la route est listée');

  console.log('\n3️⃣ **Tester la route:**');
  console.log('   • Utilisez ce script: node test-mailgun-route.js');
  console.log('   • Ou envoyez un email manuel vers abdoul@sentreso.com');
  console.log('   • Vérifiez kaneaziz@gmail.com');
}

function showTroubleshooting() {
  console.log('\n🔍 Dépannage:\n');

  console.log('❌ **Problème: Emails n\'arrivent pas**');
  console.log('   • Vérifiez la configuration DNS (MX records)');
  console.log('   • Vérifiez que la route est activée');
  console.log('   • Attendez la propagation DNS (24-48h)');
  console.log('   • Vérifiez les logs Mailgun');

  console.log('\n❌ **Problème: Emails dans spam**');
  console.log('   • Configurez SPF, DKIM, DMARC');
  console.log('   • Améliorez la réputation du domaine');
  console.log('   • Utilisez des templates professionnels');

  console.log('\n❌ **Problème: Erreur de configuration**');
  console.log('   • Vérifiez les paramètres de la route');
  console.log('   • Testez avec une adresse email différente');
  console.log('   • Contactez le support Mailgun');
}

// Fonction principale
async function main() {
  console.log('📧 Test Route Mailgun - Sentreso Finance\n');

  await testMailgunRoute();
  showMailgunDashboardSteps();
  showTroubleshooting();

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Test terminé!');
  console.log('\n📧 Prochaines étapes:');
  console.log('1. Créez la route dans Mailgun Dashboard');
  console.log('2. Testez avec ce script');
  console.log('3. Vérifiez kaneaziz@gmail.com');
  console.log('4. Configurez d\'autres routes si nécessaire');

  console.log('\n📞 Support:');
  console.log('   • Mailgun: https://help.mailgun.com');
  console.log('   • Sentreso: support@sentreso.com');
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testMailgunRoute,
  showMailgunDashboardSteps,
  showTroubleshooting
};
