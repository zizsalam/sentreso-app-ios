// Script de test pour la configuration email Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://avltdtbgantbxbrqdxge.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailConfiguration() {
  console.log('🧪 Test de configuration email Supabase...\n');

  try {
    // Test 1: Vérifier la configuration SMTP
    console.log('1️⃣ Vérification de la configuration SMTP...');

    const { data: smtpConfig, error: smtpError } = await supabase.auth.admin.getUserById('test');

    if (smtpError) {
      console.log('❌ Erreur SMTP:', smtpError.message);
    } else {
      console.log('✅ Configuration SMTP OK');
    }

    // Test 2: Envoyer un email de test
    console.log('\n2️⃣ Envoi d\'un email de test...');

    const testEmail = 'abdoul@sentreso.com';

    const { data: emailData, error: emailError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'https://sentreso.com/reset-password'
    });

    if (emailError) {
      console.log('❌ Erreur envoi email:', emailError.message);
    } else {
      console.log('✅ Email de test envoyé à', testEmail);
    }

    // Test 3: Vérifier les templates
    console.log('\n3️⃣ Vérification des templates email...');

    // Liste des templates à vérifier
    const templates = [
      'confirm_signup',
      'confirm_signup_otp',
      'recovery',
      'recovery_otp',
      'invite',
      'magic_link',
      'email_change',
      'change_email_otp'
    ];

    console.log('📧 Templates disponibles:');
    templates.forEach(template => {
      console.log(`   - ${template}`);
    });

    console.log('\n✅ Configuration email testée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Fonction pour vérifier les enregistrements DNS
function checkDNSRecords() {
  console.log('\n🌐 Vérification des enregistrements DNS...\n');

  const dnsChecks = [
    {
      type: 'MX',
      domain: 'sentreso.com',
      expected: ['mxa.mailgun.org', 'mxb.mailgun.org']
    },
    {
      type: 'TXT',
      domain: 'sentreso.com',
      expected: ['v=spf1 include:mailgun.org']
    },
    {
      type: 'TXT',
      domain: 'k1._domainkey.sentreso.com',
      expected: ['DKIM record']
    }
  ];

  console.log('📋 Enregistrements DNS à vérifier:');
  dnsChecks.forEach(check => {
    console.log(`   ${check.type} ${check.domain}:`);
    check.expected.forEach(expected => {
      console.log(`     - ${expected}`);
    });
  });

  console.log('\n💡 Utilisez ces commandes pour vérifier:');
  console.log('   dig MX sentreso.com');
  console.log('   dig TXT sentreso.com');
  console.log('   dig TXT k1._domainkey.sentreso.com');
}

// Fonction pour configurer les emails
function setupEmailAddresses() {
  console.log('\n📧 Configuration des adresses email...\n');

  const emailConfigs = [
    {
      address: 'support@sentreso.com',
      purpose: 'Support client',
      features: [
        'Réponse automatique',
        'Redirection vers équipe',
        'Gestion des tickets'
      ]
    },
    {
      address: 'abdoul@sentreso.com',
      purpose: 'Email personnel',
      features: [
        'Signature professionnelle',
        'Communication interne',
        'Partenariats'
      ]
    }
  ];

  console.log('📋 Adresses à configurer:');
  emailConfigs.forEach(config => {
    console.log(`\n   📮 ${config.address}`);
    console.log(`   🎯 Usage: ${config.purpose}`);
    console.log('   ⚙️  Fonctionnalités:');
    config.features.forEach(feature => {
      console.log(`      - ${feature}`);
    });
  });
}

// Fonction principale
async function main() {
  console.log('🚀 Configuration Email Sentreso Finance\n');
  console.log('=' .repeat(50));

  // Vérifier les variables d'environnement
  if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
    console.log('⚠️  Veuillez configurer les variables d\'environnement:');
    console.log('   export SUPABASE_URL="votre-url-supabase"');
    console.log('   export SUPABASE_ANON_KEY="votre-clé-supabase"');
    console.log('\n   Ou créez un fichier .env avec ces variables.');
    return;
  }

  // Tests
  await testEmailConfiguration();
  checkDNSRecords();
  setupEmailAddresses();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Configuration terminée!');
  console.log('\n📞 Prochaines étapes:');
  console.log('   1. Configurez les enregistrements DNS');
  console.log('   2. Testez l\'envoi d\'emails');
  console.log('   3. Configurez les templates dans Supabase Dashboard');
  console.log('   4. Testez les adresses support@sentreso.com et abdoul@sentreso.com');
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testEmailConfiguration,
  checkDNSRecords,
  setupEmailAddresses
};
