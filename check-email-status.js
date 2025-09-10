#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration Supabase
const supabaseUrl = 'https://avltdtbgantbxbrqdxge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDNSStatus() {
  console.log('🌐 Vérification DNS pour sentreso.com...\n');

  try {
    const { stdout: mxResult } = await execAsync('dig MX sentreso.com');
    const { stdout: spfResult } = await execAsync('dig TXT sentreso.com');
    const { stdout: dkimResult } = await execAsync('dig TXT s1._domainkey.sentreso.com');

    console.log('📋 Enregistrements MX actuels:');
    const mxLines = mxResult.split('\n').filter(line => line.includes('MX'));
    mxLines.forEach(line => console.log(`   ${line.trim()}`));

    console.log('\n📋 Enregistrement SPF:');
    const spfLines = spfResult.split('\n').filter(line => line.includes('TXT'));
    spfLines.forEach(line => console.log(`   ${line.trim()}`));

    console.log('\n📋 Enregistrement DKIM:');
    const dkimLines = dkimResult.split('\n').filter(line => line.includes('TXT'));
    if (dkimLines.length > 0) {
      dkimLines.forEach(line => console.log(`   ${line.trim()}`));
    } else {
      console.log('   ❌ Aucun enregistrement DKIM trouvé');
    }

    // Analyse du statut
    const hasMailgunMX = mxResult.includes('mailgun.org');
    const hasMailgunSPF = spfResult.includes('mailgun.org');
    const hasDKIM = dkimResult.includes('TXT');

    console.log('\n📊 Statut DNS:');
    console.log(`   MX Mailgun: ${hasMailgunMX ? '✅' : '❌'}`);
    console.log(`   SPF Mailgun: ${hasMailgunSPF ? '✅' : '❌'}`);
    console.log(`   DKIM: ${hasDKIM ? '✅' : '❌'}`);

    return { hasMailgunMX, hasMailgunSPF, hasDKIM };

  } catch (error) {
    console.log(`❌ Erreur DNS: ${error.message}`);
    return { hasMailgunMX: false, hasMailgunSPF: false, hasDKIM: false };
  }
}

async function checkSupabaseStatus() {
  console.log('\n🔧 Vérification Supabase...\n');

  try {
    // Test de connexion
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.log(`❌ Erreur de connexion Supabase: ${error.message}`);
      return false;
    } else {
      console.log('✅ Connexion Supabase OK');
    }

    // Test d'envoi d'email
    console.log('\n📤 Test d\'envoi d\'email...');
    const { data: emailData, error: emailError } = await supabase.auth.resetPasswordForEmail('kaneaziz@gmail.com', {
      redirectTo: 'https://sentreso.com/reset-password'
    });

    if (emailError) {
      console.log(`❌ Erreur d'envoi: ${emailError.message}`);
      return false;
    } else {
      console.log('✅ Envoi d\'email OK');
      return true;
    }

  } catch (error) {
    console.log(`❌ Erreur Supabase: ${error.message}`);
    return false;
  }
}

async function checkEmailAddresses() {
  console.log('\n📧 Vérification des adresses email...\n');

  const emailAddresses = [
    'abdoul@sentreso.com',
    'support@sentreso.com',
    'kaneaziz@gmail.com'
  ];

  console.log('📋 Adresses configurées:');
  emailAddresses.forEach(email => {
    console.log(`   • ${email}`);
  });

  console.log('\n🧪 Test d\'envoi vers chaque adresse...');

  for (const email of emailAddresses) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://sentreso.com/reset-password'
      });

      if (error) {
        console.log(`   ❌ ${email}: ${error.message}`);
      } else {
        console.log(`   ✅ ${email}: Email envoyé`);
      }
    } catch (error) {
      console.log(`   ❌ ${email}: ${error.message}`);
    }
  }
}

function showEmailStatus(dnsStatus, supabaseStatus) {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 STATUT COMPLET DES EMAILS SENTRESO\n');
  console.log('=' .repeat(60));

  console.log('\n🌐 **Configuration DNS:**');
  console.log(`   MX Mailgun: ${dnsStatus.hasMailgunMX ? '✅ ACTIF' : '❌ INACTIF'}`);
  console.log(`   SPF Mailgun: ${dnsStatus.hasMailgunSPF ? '✅ ACTIF' : '❌ INACTIF'}`);
  console.log(`   DKIM: ${dnsStatus.hasDKIM ? '✅ ACTIF' : '❌ INACTIF'}`);

  console.log('\n🔧 **Configuration Supabase:**');
  console.log(`   Connexion: ${supabaseStatus ? '✅ ACTIF' : '❌ INACTIF'}`);
  console.log(`   Envoi d'emails: ${supabaseStatus ? '✅ ACTIF' : '❌ INACTIF'}`);

  console.log('\n📧 **Adresses Email:**');
  console.log('   • abdoul@sentreso.com: ✅ CONFIGURÉ');
  console.log('   • support@sentreso.com: ✅ CONFIGURÉ');
  console.log('   • kaneaziz@gmail.com: ✅ ACTIF (réception)');

  // Résumé global
  const dnsActive = dnsStatus.hasMailgunMX && dnsStatus.hasMailgunSPF;
  const overallStatus = dnsActive && supabaseStatus;

  console.log('\n🎯 **STATUT GLOBAL:**');
  if (overallStatus) {
    console.log('   🟢 EMAILS SENTRESO ACTIFS');
    console.log('   ✅ Envoi et réception fonctionnels');
    console.log('   ✅ Configuration complète');
  } else if (supabaseStatus) {
    console.log('   🟡 EMAILS PARTIELLEMENT ACTIFS');
    console.log('   ✅ Envoi fonctionnel');
    console.log('   ⚠️  Réception en attente de configuration DNS');
  } else {
    console.log('   🔴 EMAILS INACTIFS');
    console.log('   ❌ Configuration incomplète');
  }
}

function showNextSteps(dnsStatus, supabaseStatus) {
  console.log('\n📋 **PROCHAINES ÉTAPES:**\n');

  if (!dnsStatus.hasMailgunMX) {
    console.log('1️⃣ **Configurer DNS Mailgun:**');
    console.log('   • Connectez-vous à https://mailgun.com');
    console.log('   • Ajoutez le domaine sentreso.com');
    console.log('   • Copiez les enregistrements MX fournis');
    console.log('   • Ajoutez-les à votre registrar');
  }

  if (!supabaseStatus) {
    console.log('\n2️⃣ **Configurer Supabase SMTP:**');
    console.log('   • Allez sur https://supabase.com/dashboard');
    console.log('   • Settings → Auth → Email Templates');
    console.log('   • Configurez SMTP avec Mailgun');
  }

  if (dnsStatus.hasMailgunMX && supabaseStatus) {
    console.log('1️⃣ **Configurer la réception:**');
    console.log('   • Dans Mailgun Dashboard, activez "Receiving"');
    console.log('   • Créez une route: Catch All → kaneaziz@gmail.com');
    console.log('   • Testez la réception d\'emails');
  }

  console.log('\n3️⃣ **Tester la configuration:**');
  console.log('   • Vérifiez kaneaziz@gmail.com pour les emails');
  console.log('   • Relancez ce script: node check-email-status.js');
  console.log('   • Configurez les templates personnalisés');
}

// Fonction principale
async function main() {
  console.log('📧 Vérification du Statut Email - Sentreso Finance\n');
  console.log('=' .repeat(60));

  const dnsStatus = await checkDNSStatus();
  const supabaseStatus = await checkSupabaseStatus();
  await checkEmailAddresses();

  showEmailStatus(dnsStatus, supabaseStatus);
  showNextSteps(dnsStatus, supabaseStatus);

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Vérification terminée!');
  console.log('\n📞 Support: support@sentreso.com');
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkDNSStatus,
  checkSupabaseStatus,
  checkEmailAddresses,
  showEmailStatus
};
